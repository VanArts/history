/*global __dirname, console, module, require*/
'use strict';
var appRoot = require('app-root-path'),
	boom = require("boom"),
	constant = require("./global-constant.js"),
	debugMsg,
	fs = require('fs'),
	path = require('path'),
	util = require("./util.js");
debugMsg = function (msg) {
	if (constant.config.debug && constant.config.debug === true) {
		console.log(msg);
	}
};

/***
*     ######
*     #     # #####  ###### #    # # ###### #    #
*     #     # #    # #      #    # # #      #    #
*     ######  #    # #####  #    # # #####  #    #
*     #       #####  #      #    # # #      # ## #
*     #       #   #  #       #  #  # #      ##  ##
*     #       #    # ######   ##   # ###### #    #
*
*/
/**
Generate preview sized thumbnail photos for directory viewing

@method preview
@param {object} arg arguments
@param {object} arg.body Express POST variables
@param {string} arg.body.folder Path to directory
@param {object} arg.response
@param {object} arg.request
@return {undefined}
**/
module.exports.preview = function (meta, arg, cb) {
	var addToQueue,
		afterThumbCreated,
		createThumb,
		dimension = {"width": 200, "height": 200},
		count = {
			"imageInitiated": 0,
			"imageLength": 0,
			"thumbCreated": 0
		},
		gm = require('gm'),
		items = meta.result.items,
		mkdirp = require('mkdirp'),
		out = [],
		possibleOutput,
		queue,
		worker;
	count.imageLength = items.length;

	addToQueue = function () {
		var item = items[count.imageInitiated];
		if (item === undefined) {
			debugMsg("addToQueue no item;");
			return;
		}
		debugMsg("addToQueue has item;");
		queue.push(item, function (errorEach) {
			if (errorEach) {
				cb(boom.wrap(errorEach));
			}
			var filename = item.name + item.ext;
			debugMsg("Thumbnail processed: " + filename + ";");
		});
	};

	createThumb = function (item) {
		var sourcePath = path.join(__dirname, "../../", item.path.abs),
			targetPath,
			filename = item.name + item.ext;
		if (constant.config.tempThumbFolder) {
			targetPath = path.join(sourcePath, constant.config.tempThumbFolder);
		} else {
			targetPath = sourcePath;
		}
		debugMsg("ifImage: filename=" + filename + "; targetPath=" + targetPath + "; sourcePath=" + sourcePath + ";");

		mkdirp(targetPath, function (errorNewPath) {
			if (errorNewPath) {
				cb(boom.wrap(errorNewPath, 500, "Path failed: " + targetPath));
			}

			if (fs.existsSync(path.join(targetPath, filename))) { // file exists
				debugMsg("createThumb: file exists:" + path.join(targetPath, filename) + ";");
				afterThumbCreated();
				return;
			}
			debugMsg("ifImage resize image: filename="+path.join(sourcePath, filename)+";");

			gm(path.join(sourcePath, filename))
				.resize(dimension.width, dimension.height + ">")
				.gravity('Center')
				.extent(dimension.width, dimension.height)
				.write(path.join(targetPath, filename), afterThumbCreated);
		});
	};

	worker = function (item, callback) {
		var filename = item.name + item.ext;
		debugMsg("Asynce queue item: " + filename + ";");

		if (item.content.type === "image") {
			// debugMsg("ifImage; start create thumb");
			createThumb(item);
			if (constant.config.tempThumbFolder) {
				out.push(path.join(constant.config.tempThumbFolder, "/", item.name + item.ext));
			} else {
				out.push(item.name + item.ext);
			}
		} else {
			// debugMsg("ifImage; file type="+item.content.type+";");
			afterThumbCreated();
		}

		callback();
	};

	possibleOutput = function (callee) {
		var done = false;
		debugMsg("possibleOutput: count.thumbCreated="+count.thumbCreated+"; count.imageLength="+count.imageLength+"; callee="+callee+";");
		if (count.imageLength === 0) { // no images in this directory
			done = true;
		} else if (count.thumbCreated === count.imageLength) {
			done = true;
		}
		if (done === true) {
			cb({"thumbnails":out});
		}
	};

	afterThumbCreated = function (errorWriting) {
		if (errorWriting) {
			boom.wrap(errorWriting, 500, "Create thumb writing error");
		}
		debugMsg("afterThumbCreated");
		count.thumbCreated++;
		possibleOutput("afterThumbCreated");
		count.imageInitiated++;
		addToQueue();
	};
	queue = require("async").queue(worker, 3);
	addToQueue();
};

/***
*     #######
*     #       #    #  ####  #    # #####  ######
*     #       ##   # #      #    # #    # #
*     #####   # #  #  ####  #    # #    # #####
*     #       #  # #      # #    # #####  #
*     #       #   ## #    # #    # #   #  #
*     ####### #    #  ####   ####  #    # ######
*
*/
/**
Create (or use existing) directory with children directories originals, photos, thumbs

@method ensureDestinationFolder
@param {object} arg arguments
@param {string} arg.targetFolderName Destination folder's name for this photo batch
@param {string} [arg.destinationRootPath=resizeImages=Global resize folder] Destination photo path excluding filename
@param {callback} function(err, verifiedPaths)
**/
function _ensureDestinationFolder(arg, callback) {
	var createOrVerifyFolder,
		destinationPath,
		mkdirp = require('mkdirp'),
		out = [];

	destinationPath = arg.destinationRootPath || path.join(appRoot.path, constant.config.resizeFolder);
	createOrVerifyFolder = function (folder) {
		return new Promise(function(resolve, reject) {
			var folderPath;
			if (typeof arg.targetFolderName === "number") {
				return reject(util.setError(null, "targetFolderName must be a string for path.join"));
			}
			folderPath = path.join(destinationPath, folder, arg.targetFolderName);
			mkdirp(folderPath, function (err) {
				if (err) {
					return reject(util.setError(err, "Path cannot be created (" + folderPath + ")"));
				}
				return resolve(folderPath);
			});
		});
	};

	createOrVerifyFolder("originals")
	.then(function (path) {
		out.push(path);
		return createOrVerifyFolder("photos");
	})
	.then(function (path) {
		out.push(path);
		return createOrVerifyFolder("thumbs");
	})
	.then(function (path) {
		out.push(path);
		return callback(null, out);
	})
	.catch(function (err) {
		return callback(err, out);
	});
}
module.exports.ensureDestinationFolder = _ensureDestinationFolder;

/***
*     ######                                       ######
*     #     # ###### #      ###### ##### ######    #     #   ##   ##### #    #
*     #     # #      #      #        #   #         #     #  #  #    #   #    #
*     #     # #####  #      #####    #   #####     ######  #    #   #   ######
*     #     # #      #      #        #   #         #       ######   #   #    #
*     #     # #      #      #        #   #         #       #    #   #   #    #
*     ######  ###### ###### ######   #   ######    #       #    #   #   #    #
*
*/
/**
Delete path (file or folder)

@method deletePath
@param {object} arg hapi payload
@param {string} arg.path || arg.tempThumbFolder
@param {callback}
**/
function _deletePath(arg, callback) {
	var targetPath,
    exists = require('/plugins/exists/lib');
	if (arg.path === undefined) {
		if (arg.tempThumbFolder === undefined) {
			return callback(util.setError(null, "Missing required argument target path"));
		} else {
			targetPath = path.join(arg.tempThumbFolder, constant.config.tempThumbFolder);
		}
	} else {
		targetPath = path.join(arg.path);
	}
	targetPath = path.join(appRoot.path, targetPath);
	targetPath = decodeURIComponent(targetPath);

	require('rimraf')(targetPath, function(err) {
		var out = {
			"meta": {
				"error": {
					"message": "Something failed while deleting a path"
				}
			}
		};
		if (err) {
			return callback(util.setError(err, "Delete failed on this path (" + targetPath + ")"));
		}
		exists(targetPath)
			.then(function (result) {
				return callback(util.setError(err, "Delete failed on this path (" + result.path + ")"));
			})
			.catch(function () {
				delete out.meta.error;
				out.meta.success = {
					"message": "Successfully deleted this path (" + targetPath + ")"
				};
				return callback(out);
			});
	});
}
module.exports.deletePath = _deletePath;


/***
*     #     #                         ######
*     ##   ##  ####  #    # ######    #     # #    #  ####  #####  ####   ####
*     # # # # #    # #    # #         #     # #    # #    #   #   #    # #
*     #  #  # #    # #    # #####     ######  ###### #    #   #   #    #  ####
*     #     # #    # #    # #         #       #    # #    #   #   #    #      #
*     #     # #    #  #  #  #         #       #    # #    #   #   #    # #    #
*     #     #  ####    ##   ######    #       #    #  ####    #    ####   ####
*
*/
/**
Move source photo to destination originals folder

@method movePhotos
@param {object} arg arguments
@param {string} [arg.destinationRootPath=resizeImages] Destination photo path excluding filename
@param {object} arg.assets { sort: ["2014-12-18"], "2014-12-18": { files: [ {moved: "", raw: "", renamed: "" } ] } }
@param {boolean} arg.moveToResize Change directory
@return {object} arg arguments
@return {string[]} arg.files Collection of before and after filename
**/
function _movePhotos(arg, callback) {
	var afterRename,
		assets = [],
		beforeRename,
		callbackCount = 0,
		destinationPath,
		isMoveToResize,
		possibleCallback,
		queue,
		worker,
		yearStr,
		yearInt;

	(function verifyArgs() {
		arg.assets.sort.forEach(function (id) {
			if (arg.assets[id] === undefined) {
				throw new ReferenceError("_movePhotos: Missing files for '" + id + "'");
			}
		});
	})();

	worker = function (file, nextCallback) {
		var sourceFilename = path.join(appRoot.path, file.source.path.value),
			targetFilename = path.join(appRoot.path, file.destination.path.value),
			targetPath,
      exists = require('/plugins/exists/lib');
		targetPath = targetFilename.replace(path.basename(targetFilename), "");

		debugMsg("Worker file.source.path.value(" + file.source.path.value + "); file.destination.path.value(" + file.destination.path.value + ");");
		debugMsg("Worker sourceFilename(" + sourceFilename + "); targetFilename(" + targetFilename + "); targetPath(" + targetPath + ");");
		exists(sourceFilename)
			.then(function () {
				return exists(targetPath);
			})
			.then(function () {
				fs.rename(sourceFilename, targetFilename, function (errRename) {
					if (errRename) {
						queue.kill();
						return callback(util.setError(errRename, "Worker image renaming warning sourceFilename(" + sourceFilename + ") targetFilename(" + targetFilename + ")"));
					}
					possibleCallback();
				});
				nextCallback();
			})
			.catch(function (result) {
				return callback(util.setError(null, "Worker path does not exist (" + result.path + ")"));
			});
	};

	possibleCallback = function () { // calculate if all async calls are complete
		callbackCount++;

		if (callbackCount === (assets.length + 1)) { // +1 for drain
			return callback(null, {"assets": assets});
		}
	};

	destinationPath = decodeURIComponent(arg.destinationRootPath || path.join(constant.config.resizeFolder, 'originals'));
	isMoveToResize = (arg.moveToResize === "true" || arg.moveToResize === true);

	arg.assets.sort.forEach(function (id) {
		arg.assets[id].files.forEach(function (file) {
			beforeRename = decodeURIComponent(file.raw);
			afterRename = decodeURIComponent((isMoveToResize) ? path.join(destinationPath, file.moved) : file.renamed);

			debugMsg("_movePhotos: beforeRename(" + beforeRename + "); afterRename(" + afterRename + "); isMoveToResize(" + isMoveToResize + ")");

			if (beforeRename === undefined || beforeRename === "" || afterRename === undefined || afterRename === "") {
				return callback(util.setError(null, "Empty filename found, cannot rename file"));
			}
			assets.push({
				"destination": {
					"moved": isMoveToResize,
					"path": {
						"type": "relative",
						"value": afterRename
					}
				},
				"mediaType": file.mediaType,
				"source": {
					"path": {
						"type": "relative",
						"value": beforeRename
					}
				}
			});
		});
	});


	if (!isMoveToResize) {
		debugMsg("_movePhotos: assets is" + JSON.stringify(assets, null, 4));
		return callback(util.setError(null, "_movePhotos: isMoveToResize is false"));
	}
	yearStr = arg.assets.sort[0].substring(0, 4);
	yearInt = parseInt(yearStr, 10);
	if (typeof yearInt === "number" && /\d{4}/.test(yearInt)) {
		debugMsg("_movePhotos: yearStr(" + yearStr + ")");
		_ensureDestinationFolder({"targetFolderName": yearStr}, function(err) {
			if (err) {
				return callback(util.setError(err));
			}
			queue = require("async").queue(worker, 1);

			queue.push(assets, function(errorEach){
				if (errorEach) {
					return callback(util.setError(errorEach));
				}
			});
			queue.drain = possibleCallback;
		});
	} else {
		return callback(util.setError(null, "_movePhotos: Destination directories (photos, thumbs) are not created as '" + yearStr + "' is not a year."));
	}
}
module.exports.movePhotos = _movePhotos;
