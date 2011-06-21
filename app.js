
/**
 * module dependencies.
 */

var express = require('express'),
    events = require('events'),
    sys = require('sys'),
    fs = require('fs'),
    CustomBuild = require('./services/builder/custom_build').CustomBuild,
    Encode64 = require('./services/builder/encode64').Encode64,
    undefined;


var app = module.exports = express.createServer();

/**
 * constants.
 */

var meta = {
    "title": "Chico UI, the toolbox for the Web.",
    "navigation": {
       "top": [
           {"label": "Home", "href": "/"},
           {"label": "Download", "href": "/download"},
           {"label": "Getting Started", "href": "https://github.com/mercadolibre/chico/wiki"},
           {"label": "API", "href": "/api/index.html"},
           {"label": "Support", "href": "/support"}
       ],
   
       "bottom": [
            {"label": "Download", "href": "/"},
            {"label": "Current release", "href": "/download"},
            {"label": "Past releases", "href": "http://download.chico-ui.com.ar/"},
            {"label": "Source code", "href": "https://github.com/mercadolibre/chico/"},
            {"label": "Support", "href": "/support/faq"},
            {"label": "FAQ", "href": "/support/faq"},
            {"label": "Issue tracker", "href": "https://github.com/visionmedia/jade/issues"},
            {"label": "Mailing list", "href": "https://groups.google.com/group/chico-ui"},
            {"label": "Get in touch", "href": "/"},
            {"label": "on Twitter", "href": "http://twitter.com/chicoui"},
            {"label": "on Facebook", "href": "http://www.facebook.com/pages/Chico-UI/189546681062056"},
            {"label": "our Google Group", "href": "https://groups.google.com/group/chico-ui"}
        ]

   }

}

/**
 * app configuration.
 */
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

/**
 * rutes
 */

// Probando post de form
app.post( '/test/post' , function( req, res ) {

    console.log( req.body );

    res.header('Content-Type', "text/html" );
    res.send( req.body );
    
});

// Para nico
app.get( '/img/:id?', function( req, res ) {
    
    var id = req.params.id;

	fs.readFile( __dirname + "/public/vip-images/" + id , function(err, data) {

        setTimeout( function() {
        
            res.header( 'Content-Type' , 'image/jpeg' );
            res.send( data );
        
        }, 10000 );
	   
	});
    
})

// Para lean
app.get( '/lastest/:type/:min?', function( req, res ) {
       
    var type = req.params.type;
    var min = req.params.min;
    
    var packages = [{
        "name": "chico",
        "input": "../chico/src/"+type+"/",
        "type": type,
        "min": (min) ? true : false,
        "virtual": true // Don't write the files
    }];
    
    var custom = new CustomBuild( packages );
        custom.avoidCompress();
        custom.on( "processed" , function( data ) {
            res.header('Content-Type', (type==="js") ? "text/javascript" : "text/css" );
            res.send( data );
        });
    
});



app.get( '/encode', function( req, res ) {
    
    var encodedImage = new Encode64("./public/src/assets/ninja.jpg");
    
        encodedImage.on( "encoded", function( data ){
            res.send( data.toString() ); 
        });
    
});

/**
 * Download
 */
// get 
app.get( '/download', function( req, res ) {
    
  res.render( 'download', meta );
  
});

// post 
app.post('/download', function( req, res ){

//    console.log( req.body );

    var components = ( typeof req.body.class === "object" ) ? // If collection 
                        req.body.class.join(",") : 
                        req.body.class,
        abstracts = ( typeof req.body.abstract === "object" ) ? // If collection 
                        req.body.abstract.join(",") : 
                        req.body.abstract,
        utils = ( typeof req.body.util === "object" ) ? // If collection 
                        req.body.util.join(",") : 
                        req.body.util,
        flavor = req.body.flavor,
        use_mesh = req.body.mesh,
        embed = req.body.embed;
        env = req.body.env;

    if ( !abstracts || !utils || !components ) {
        res.send(); // Avoid process without components
        return;
    }

    // JavaScripts Pack
    var js = function() {
        return {
            "name": "chico",
            "input": "../chico/src/js/",
            "components": abstracts.toLowerCase() + "," + utils.toLowerCase() + "," + components.toLowerCase(),
            "type": "js"
        }
    };

    // Stylesheets Pack
    var css = function() {
        return {
            "name": "chico",
            "input": "../chico/src/" + flavor + "/css/",
            "components": components + ( ( use_mesh ) ? ",mesh" : "" ),
            "embed": ( embed ) ? true : false,
            "type": "css"
        }
    };
    
    // Mesh Pack
    var mesh = function() {
        return {
            "name": "mesh",
            "input": "../chico/src/css/",
            "components": "mesh",
            "embed": ( embed ) ? true : false,
            "type": "css"
        }
    };

    // Pack the thing
    var packages = [];
    // for Production
    if ( env.toString().indexOf("p") > -1 ) {
        // JS
        var p_js = js();
            p_js.min = true;
            packages.push(p_js);
        // CSS
        var p_css = css();
            p_css.min = true;
            packages.push(p_css);
    }
    
    // for Dev
    if ( env.toString().indexOf("d") > -1 ) {
        // JS
        var d_js = js();
            packages.push( d_js );
        // CSS
        var d_css = css();
            packages.push( d_css );
    }

    console.log(packages);
    
    var custom = new CustomBuild( packages );
        custom.on("done", function( uri ) {
            //res.send( uri );
            res.redirect( uri );
        });

});


/**
 * Getting started.
 */
// get
app.get('/getting-started', function(req, res){
  res.render('getting-started', meta );
});

/**
 * Index.
 */
// get
app.get('/', function(req, res){
  res.render('index', meta );
});


/**
 * app start
 */
app.listen(3000);

/**
 * log
 */
console.log("Express server listening on port %d", app.address().port);