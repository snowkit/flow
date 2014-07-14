`flow package [target] [--options]`

  [target] is implied as your current system if not specified.

  `flow package` will compress your build output folder (specified in the flow file) to an archive, for backup or distribution.

  options

    --archive <tar, zip>   
        specify the format of the archive. default is zip.
        usage shows zip extension, but extension will vary by chosen format

    --archive-name <target/path/packagename>   
        Specify where to, and what to call the package file. Extension is automatically appended based on `--archive`.  
        Relative to your project root, or an absolute path.   
        defaults to `(project output)/(target).(date-time).ext
        an example of the default formatting - web.01.july.2014-23.12.04.zip

    --archive-root <subfolder>   
        specify the sub folder within the archive in which to store the contents.   
        for example, on windows, a bin/windows/*.* would be stored inside `(archive)/flowapp.exe` etc   
        this flag changes the archive root, like `(archive)/myapp/flowapp.exe` such that on expanding the archive the files are not loose.

  examples   

    `flow package web --archive-root 'myapp' --output 'builds/package`