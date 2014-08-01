`flow build [target] --options`

  [target] is implied as your current system if not specified.

The build command will execute the target build into the output folder.
The process calls `clean` (only if requested), `hooks` and `files` and then the build itself.

This means that any of the --options for `clean`, `hooks` and `files` applies.

  see
    `flow usage clean`
    `flow usage hooks`
    `flow usage files`

options

    --clean
        runs the clean command before building. see `flow usage clean`