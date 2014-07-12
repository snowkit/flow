`flow run [target] --options`

  [target] is implied as your current system if not specified. 
  
  `flow run` will execute `build`, `files`, `launch` in that order.    
  `--options` includes all options from the listed commands.
  
  for full info, `flow usage` and more specifically   
    `flow usage build`    
    `flow usage files`   
    `flow usage launch`   

  examples :   

    `flow run`   
        build, and run the current system as the target

    `flow run web --port 6000`   
        build, and run the internal server on port 6000

    `flow run android --no-launch 6000`   
        build, install but don't launch the app