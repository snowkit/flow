

exports.defines = function defines(flow, project, existing) {

        //start with given value
    existing = existing || {};

        //check for the defines flag on the build object
    var list = [];
    if(project.build.defines) {
        list = project.build.defines;
    } else {
        console.log('no defines in %s', project.name);
    }

        //for each define, parse it
    for(index in list) {
        var define = list[index];
        var split = define.split('=');
        for(item in split) {
            split[item] = split[item].trim();
        }

        var define = {
            name : split[0],
            value : split.length > 1 ? split[1] : ''
        };

            //only store if not found, to respect child project overrides

        if(!existing[define.name]) {
            existing[define.name] = define;
        } //if not found already

    } //each in the list

        //check each dependency for defines
    for(name in project.depends) {
        var depend = project.depends[name];

            //possible for a null project, i.e no flow.json in dependency
        if(depend.project) {
            existing = exports.defines(flow, depend.project, existing);
        }
    }

    return existing;

} //defines