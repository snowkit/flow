`flow run [target] --options`

  [target] is implied as your current system if not specified. 
  
  `flow run` will execute `build`, `files`, `launch` in that order.    
  `--options` includes all options from the listed commands.
  
  for full info, `flow usage` or   
    `flow usage build`    
    `flow usage files`   
    `flow usage launch`   

  examples :   
    `flow run`   
    `flow run web --port 6000`