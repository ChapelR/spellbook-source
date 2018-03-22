This is the source code for my [spellbook app](https://chapelr.github.io/spellbook/).

### Building From Source

To build the app from source, you'll need [Tweego](http://www.motoslave.net/tweego/#downloads) (>= v1.3.0) and [SugarCube](http://www.motoslave.net/sugarcube/2/#downloads) (>= v2.24.0).  You'll also need [Node.js](https://nodejs.org/en/).

Get Tweego installed and point it toward SugarCube.  If you aren't sure how, you can just place the Tweego binary in the directory with the repo.  You can place the `sugarcube-2` folder inside a directory called `story-formats` in the same place, and everything should work.

After you have everything set up, run `npm install` to install the development dependencies.

The projects structure works like this:

* JavaScript and CSS go in the `src` directory.  You need to run `gulp build` to have these files concatenated, minified, and sent to the appropriate places in the `project` directory or they won't be compiled into the project by Tweego.
* Twee code goes in the `project` directory.  You can also place JavaScript and CSS here, but it won't get minified if you do.
* To build everything, use Tweego by running `tweego --head=src\HEAD.html -o dist\index.html project`.
* The compiled build will be available in the `dist` directory as `index.html`, where you can play it.

### Using Twine 1 or 2 to Edit

If you'd rather use Twine 1 or 2, you can either import `dist/index.html` directly into Twine 2, or build an archive file for Twine 1 or 2 [using Tweego](http://www.motoslave.net/tweego/docs/#usage).  Note that some features unique to Tweego (specifically adding the `HEAD.html` file to the output), will not work if you compile from Twine, so you may wich to re-export the project and use Tweego to build after editing.