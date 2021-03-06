# history [![Build Status](https://travis-ci.org/danactive/history.png?branch=master)](https://travis-ci.org/danactive/history)
[![Dependencies Status](https://david-dm.org/danactive/history.svg)](https://david-dm.org/danactive/history)
[![DevDependencies Status](https://david-dm.org/danactive/history/dev-status.svg)](https://david-dm.org/danactive/history#info=devDependencies)
[![Code Climate](https://codeclimate.com/github/danactive/history/badges/gpa.svg)](https://codeclimate.com/github/danactive/history)
[![NSP Status](https://nodesecurity.io/orgs/danactive/projects/86c4bdca-2365-43a7-b863-8dd4c21b021f/badge)](https://nodesecurity.io/orgs/danactive/projects/86c4bdca-2365-43a7-b863-8dd4c21b021f)
[![MIT Licensed](http://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](http://opensource.org/licenses/MIT)

Your personal **history** storyboarded with photo and video albums.  Associate photos with their meta data including geocode, caption... in XML albums.
* Plot thumbnails on a map
* Includes administration tools for XML generation

Installation
------
1. Node.js v6.9.x
1. Install project dependencies `yarn install` (Ensure yarn is installed globally `npm install yarn --global`
1. Start web server `yarn start`
1. View address in browser

Technologies
------
####Viewing
* XML databases for photo/video galleries
* Isomorphic React.js phasing out of JavaScript/jQuery for the pagination & lightbox

####Administration
* Node.js to support AJAX & image manipulation
* AJAX to read the XML gallery data


Dependencies
------
Included in this project
* [jQuery](http://jquery.com/) via bower
* [ColorBox (jQuery plugin)](http://www.jacklmoore.com/colorbox) via bower
* [Mapstraction (mapping)](http://mapstraction.com/) build 2.0.18
* [Google Maps (map provider)](https://developers.google.com/maps/) v3
* [Twitter Bootstrap (admin)](http://twitter.github.com/bootstrap/) v2.0.3
* [Fluid 960 Grid System (admin)](http://www.designinfluences.com/fluid960gs/)

To use the administration tools
* [node.js](http://nodejs.org/)
* [hapi.js](http://hapijs.org/)
* [GraphicsMagick](https://www.npmjs.com/package/gm) Install GraphicsMagick before npm

Photo/video album XML schemas
-------
### Current schema (2.0)

Example

	<album>
		<meta>
			<gallery>demo</gallery> <!-- gallery directory name excluding 'gallery-'; new in schema 2.0 -->
			<id>sample</id> <!--Filename is album_sample.xml; new in schema 2.0-->
			<version>1.8</version> <!--Reference schema version; new in schema 2.0-->
		</meta>
		<item><!-- photo -->
			<id>1</id> <!-- id attribute must be unique for this album; used by JavaScript & for character association -->
			<filename>2001-03-21-01.jpg</filename> <!-- must start with YYYY year; photos and thumbs must be places in this folder too -->
			<geo> <!-- geocode -->
				<lat>49.25</lat> <!-- latitude -->
				<lon>-123.1</lon> <!-- longitude -->
			</geo>
			<photo_city>Vancouver, BC</photo_city> <!-- Political location name often City, Province/State -->
			<photo_loc>Granville Island</photo_loc> <!-- General location name often neighourhood or building -->
			<photo_desc>An oversized avocado</photo_desc> <!-- The photo description only viewable in the lightbox view -->
			<thumb_caption>Lunch</thumb_caption> <!-- Less than three words to descibe the thumbnail in gallery view -->
		</item>
		<item><!-- video -->
			<type>video</type>
			<id>1</id> <!-- id attribute must be unique for this album; used by JavaScript & for character association -->
			<filename>2012-fireplace.mp4</filename> <!-- History supports both HTML5 video formats for best browser support; must start with YYYY year; photos and thumbs must be places in this folder too -->
			<filename>2012-fireplace.webm</filename>
			<photo_city>Vancouver, BC</photo_city>
			<photo_loc>Home</photo_loc>
			<thumb_caption>Video: Fireplace</thumb_caption>
			<photo_desc>A sample HTML5 video in both MP4 and WebM formats</photo_desc>
			<size><w>1280</w><h>720</h></size> <!-- Dimensions for opening the popup window and enlarging the HTML5 video -->
			<geo>
				<lat>49.25</lat>
				<lon>-123.1</lon>
			</geo>
		</item>
	</album>
