`flow build [target] --options`

  [target] is implied as your current system if not specified.

The build command will execute the target build into the output folder.
The process of `build` includes `clean` (only if requested(, `files` and then the build.

This means that any of the --options for `clean` and `files` applies.

  see
    `flow usage clean`
    `flow usage files`

options

    --clean
        runs the clean command before building. see `flow usage clean`