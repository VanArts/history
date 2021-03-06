/*global $, ajaxError, dust, util, window */
'use strict';
(function () {
  var qs = util.queryObj(),
    parent = window.walkPath.setParentFolderLink({"querystring": qs});
  function loadImages(response) {
    var arg = {},
      columns,
      html = [],
      sortArgs = { "connectWith": '.ui-sortable', "items": "> li[data-type=image]" };
    function generateThumbs(folder) {
      $.ajax({
        "url": '/admin/preview-generator',
        "data": {
          "folder": folder
        },
        "success": function (response) {
          $(".directory-thumb-wait").each(function (i) {
            this.src = "../.." + decodeURIComponent(qs.folder) + "/" + response.thumbnails[i];
            this.className = "directory-thumb";
          });
        },
        "error": ajaxError
      });
    }
    function distributeIntoColumns(items) {
      var columns = [[], [], [], [], [], []],
        i = 0,
        len = items.length;
      for (i; i < len; i++) {
        columns[Math.floor(i * columns.length / items.length)].push(items[i]);
      }
      return columns;
    }
    arg.qs = qs;
    columns = distributeIntoColumns(response.result.items);

    // Build HTML
    $.each(columns, function (i, column) {
      html.push("");
      $.each(column, function (j, item) {
        item.arg = arg;
        item.id = item.name_safe + item.ext.replace(/[\.\s\(\)]/g, "_");
        item.tempThumbFolder = "_historyThumb";
        dust.render("admin-walk_path-item.dust", item, function (err, out) {
          html[i] += out;
        });
      });
    });

    //Push HTML to DOM
    $.each(html, function (i, htm) {
      $('.js-directory-column')
        .eq(i)
        .html(htm)
        .sortable(sortArgs);
    });

    if (qs.preview === "true") {
      generateThumbs(qs.folder);
    }
  }
  function getSortedAssets() {
    var out = [];
    // list of ordered filenames
    $('.js-directory-column').each(function (x, column) {
      var $column = $(column),
        $photo,
        rawIds = []; // sortable image filenames
      if ($column.children().length <= 0) {
        return true; // continue
      }
      rawIds = $column.sortable( "toArray");

      $.each(rawIds, function (i) {
        $photo = $("#" + rawIds[i]);
        $('.js-directory-column > li[id=' + $photo.attr("id") + ']').each(function (xx, asset) {
          out.push($(asset).attr("data-filename"));
        });
      });
    });
    return out;
  }
  function bindEvents() {
    $("#btnRename, #btnResize").click(function ($event) {
      var $datepicker,
        isMoveToResize = (this.id === "btnResize"),
        xmlOutput = "";
      $event.preventDefault();

      $datepicker = $('<div id="vacationDate"></div>')
        .insertAfter(this)
        .datepicker({
          "changeMonth": true,
          "changeYear": true,
          "dateFormat": 'yy-mm-dd',
          "onSelect": function (formattedDate) {
            $datepicker.datepicker( "destroy" );

            $.ajax({
              url: '/admin/rename',
              method: 'post',
              dataType: 'json',
              data: {
                filenames: JSON.stringify(getSortedAssets()),
                prefix: formattedDate,
                source_folder: "." + qs.folder,
                rename_associated: true
              },
              success: function () {
                var $spinner = $("#spinner"),
                  ajaxCounter = 0,
                  photoCount = 1,
                  output = "",
                  spinner = function () {
                    ajaxCounter++;
                    if (photoCount === ajaxCounter) {
                      $spinner.addClass("hide");
                    }
                  },
                  deleteTempThumb = function () {
                    $.ajax({
                      "url": '/admin/delete-path',
                      "method": 'post',
                      "data": {
                        "tempThumbFolder": qs.folder
                      },
                      "error": ajaxError,
                      "complete": spinner
                    });
                  },
                  resizeImage = function () {
                    $.ajax({
                      "url": '/admin/resize',
                      "method": 'post',
                      "data": {
                        source_path: `.${qs.folder}`
                      },
                      "error": ajaxError,
                      "complete": spinner
                    });
                  };

                if (isMoveToResize === true) {
                  $spinner.removeClass("hide");
                  resizeImage();
                  deleteTempThumb();
                  output = xmlOutput;
                } else {
                  output = "Rename successfull";
                }

                $("<textarea/>")
                  .val(output)
                  .appendTo("#controls");
              },
              "error": ajaxError
            });
          }
        }); // datepicker
    }); // click
  }
  function loadNav() {
    if (parent.text === "") {
      $("#btnParentFolder").parent().addClass("hide");
    } else {
      $("#btnParentFolder")
        .removeClass("hide")
        .attr("href", parent.href)
        .find("#parentFolderName")
        .text(parent.text);
    }
  }
  $.ajax({
    "url": '/template/walk-path' + window.location.search,
    "success": loadImages,
    "error": ajaxError
  });
  loadNav();
  bindEvents();
})();
