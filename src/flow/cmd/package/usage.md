`flow package [target] [--options]`

  [target] is implied as your current system if not specified.

  `flow package` will compress your build output folder (specified in the flow file) to a archive, for backup or distribution.

  options:
    --archive <tar, zip>
        specify the format of the archive. default is zip.
        usage shows zip extension, but extension will vary by chosen format

    --output <target/path/>
        specify where to put the package. Relative to your project root, or an absolute path.
        defaults to `(project output)/`
        currently the package is named `(target).(version).(date).zip` which will be configurable in future

    --archive-root <subfolder>
        specify the sub folder within the archive in which to store the contents.
        for example, on windows, a bin/windows/*.* would be stored inside `(archive)/flowapp.exe` etc
        this flag changes the archive root, like `(archive)/myapp/flowapp.exe` such that on expanding the archive the files are not loose.

  examples:
    `flow package web --archive-root 'myapp' --output '/builds/`