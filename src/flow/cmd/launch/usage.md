`flow launch [target] [--options]`

  [target] is implied as your current system if not specified.

  `flow launch` will launch the last successful build of the project, if any.
  If no build is found a message is displayed and nothing happens.

  `launch` will install the application as well, where applicable (like mobile). See the options to suppress this.

  options

    --launch-wait <time in seconds>   
        a time in seconds to wait before actually launching the build. on desktop and mobile this is 0, ignored,   
        and on web it is set to 0.3s in order to allow the internal web server to start up first.

    target specific options:

        web

          on web, the launch command will host your application for you, running against a no-cache enabled node.js web server,
          at http://localhost:port, and automatically open your browser to that url for testing.

          --port <12345>   
              override the port on which to host the launched application

          --no-launch   
              suppress the default of opening the web page once the server starts

          --no-server   
              suppress the default of launching a web server to run the app. see --url below

          --url   
              specify a url to launch instead of the default http://localhost:<port>

        mobile

          --no-launch   
              only install on the device, will not try to launch it

          --no-install   
              will only launch any existing app on the device. useful for quicker iteration

          android

                *todo*   
            --logcat-include 'some, VALUES:I, hide:S'
                there are plenty of good defaults, and this is configurable from the flow file,
                but this allows appending additional filters, for example when temporarily testing.
                in the above example, V/some, I/some, E/some will show. I/VALUES will show.
                */hide will be silenced by the S, read the documentation on logcat for more, this maps to those.
