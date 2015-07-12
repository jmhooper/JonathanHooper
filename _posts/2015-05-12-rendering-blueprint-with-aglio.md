---
layout:     post
title:      Aglio
date:       2015-05-12 12:00:00
summary:    Using Aglio to render a Blueprint spec
---

[Blueprint](https://github.com/apiaryio/api-blueprint) is a subset of the 
[Markdown](http://daringfireball.net/projects/markdown/) markup language that is handy
for creating API specifications.
It provides a standardized way of representing a web API which allows you to do some cool things
(like generate tests from documentation with [Dredd](https://github.com/apiaryio/dredd)).

Today I'm going to talk about [Aglio](https://github.com/danielgtaylor/aglio),
a renderer for the Blueprint spec that produces static HTML.

Aglio is written in [Node](https://nodejs.org/) and provided through [NPM](https://www.npmjs.com/).
If you don't already have those setup you'll need to get them up and running then install
Aglio.

```bash
npm install -g aglio
```

After Aglio is installed, you'll need a spec to play around with.
You can write your own if you feel up to it, or you can use one of Blueprint's example specs.

I grabbed an example spec and named it `api.md`.

```bash
curl https://raw.githubusercontent.com/apiaryio/api-blueprint/master/examples/Gist%20Fox%20API%20%2B%20Auth.md -o api.md
```

### CLI

You can use Aglio's CLI tool to generate static HTML from your spec.

```bash
aglio -i api.md -o api.html
```

If you open your HTML file, you'll realize it probably doesn't look anything like what you were expecting.
You should see a bright red banner across the top of the screen with something like
"This page may not display correctly when opened as a local file; instead, view it from a web server"
splayed across the top of it.

Aglio needs to be displayed with HTTP or HTTPS because of its use of scheme-relative URLs.
If you open the static HTML file the stylesheets and JS will fail to load.

Aglio provides a rendering server to allow you circumvent this problem.
Run the following command and you should be able to access the rendered API on `http://localhost:3030`.

```bash
aglio -i api.md -s -p 3030
```

The rendering sever is very cool.
If you change your API spec and save it, Aglio will detect the change and refresh the browser for you.

### Node Library

Aglio is written in Node.js and provides some tools for generating HTML from a spec with JavaScript.
If you have Aglio installed you can use it to render your documentation.

```javascript
var aglio = require('aglio')

var SPEC_PATH = path.resolve(__dirname, 'api.md')
var SPEC_ENCODING = 'utf-8'

var blueprintSpec = fs.readFileSync(SPEC_PATH, { encoding: SPEC_ENCODING })

aglio.render(blueprintSpec, 'default', function(err, html) {
    if (err) {
      res.send("Error rendering template: " + err.message)
    } else {
      console.log(html)
    }
  })
```

The `render` method takes a string representation of the specification, a theme name, and a callback where the HTML and any errors or warnings are provided as arguments.
You can use this alongside something like [Express](http://expressjs.com/) to build your own version of the Aglio's rendering server.

That is left as an exercise for the reader.
