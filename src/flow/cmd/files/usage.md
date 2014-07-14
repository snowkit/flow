`flow files [target] --options`

  [target] is implied as your current system if not specified.

The files command will copy/template files defined from the flow file (and dependencies) into the output and build folder.
If files are missing they will be listed as a warning only - see error on missing flag.

Files must exist within their project root, otherwise the file will be ignored for security reasons, and log info generated.

options

    --no-build-files
        will not copy/template build files to the build folder

    --no-files
        will not copy/template project files to the output folder

    --no-list
        will not write out the file manifest

    --list-name
        override the manifest file list name

    --error-on-missing
        will stop in favor of missing files, normally this is a warning only
