import haxe.io.Path;


//Flow haxelib run script
// - Forwards commands directly to node.js script shown below

class Flow {

    public static var run_path : String = './';
    public static var flow_path : String = './';
    public static var node_path : String = 'bin/node';
    public static var node_script : String = 'src/flow/flow.js';
    public static var system : String = '';

    static function main() {

        var sys_args = Sys.args();

        flow_path = Sys.getCwd();
        run_path = sys_args.pop();

        system = get_platform();

            //append the system name and infp
        node_path = Path.normalize(Path.join([flow_path,node_path]));
        node_path += '-$system';

        if(system == 'linux') {
            var arch = get_arch();
            if(arch == '') arch = '32';
            node_path += arch;
        }

        //we do `node script.js run_path system <other>`

            //the second argument to flow.js is system
        sys_args.unshift(system);
            //the first argument to flow.js is run_path
        sys_args.unshift(run_path);
            //then give node the script name
        sys_args.unshift(node_script);

            //run it
        Sys.command(node_path, sys_args);

    } //main

    static function get_platform() : String {
        return Sys.systemName().toLowerCase();
    }

    static function get_arch() : String {

        switch(system) {

            case 'linux','mac' :

                var process = new sys.io.Process('uname',['-m']);
                var value = process.stdout.readAll().toString();

                (value.indexOf('64') != -1) ? return '64' : '';

            case 'windows' :

                var arch = Sys.getEnv("PROCESSOR_ARCHITEW6432");
                (arch != null && arch.indexOf('64') != -1) ? return '64' : '';

        } //switch

        return '';

    }

} //Flow