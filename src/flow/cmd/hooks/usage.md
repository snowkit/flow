`flow hooks [target] <--options>`

Execute the `project.build.pre` and `project.build.post` nodes manually.
The hooks command is also executed by the `build` command and runs pre and post commands.

This command requires options. without one, it will do nothing.

  options

        *todo*
    --skip-pre
        this is for the build command only
        when calling hooks directly,
        use the --pre or --post to be selective

        *todo*
    --skip-post
        this is for the build command only
        when calling hooks directly,
        use the --pre or --post to be selective

    --pre
        this is for running hooks directly only
        run the pre hooks

    --post
        this is for running hooks directly only
        run the post hooks

examples

  flow hooks --pre --post
      run both pre and post hooks

  flow hooks --pre
      run only pre hooks

  flow hooks --post
      run only post hooks

  flow build --skip-post
      run build without post hooks

