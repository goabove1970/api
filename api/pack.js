const { exec } = require('child_process');
const { inspect } = require('util');
const zipFolder = require('zip-folder');

exec('node -p -e "require(\'./package.json\').version"', (error, version, stderr) => {
    exec('node -p -e "require(\'./package.json\').name"', (error, name, stderr) => {
        const packageName = name.slice(0, name.length - 1);
        exec(`rm -rf ${packageName}-*.zip`, (error, stdout, stderr) => {
            const versionStr = version.slice(0, version.length - 1);
            console.log(`Packing ${packageName} version ${versionStr}`);
            const packageFileName = `${packageName}-${versionStr}.zip`;

            exec('mkdir pack_tmp', () => {
                console.log('Created pack_tmp for packaging');
                exec('cp -r {dist,node_modules,package.json} ./pack_tmp/', () => {
                    console.log('Copied source for packaging, packing...');
                    zipFolder('./pack_tmp/', packageFileName, function(err) {
                        if (err) {
                            console.log(`Packing failed: ${inspect(err)}`);
                        } else {
                            console.log(`Packing complete`);
                            console.log(`Removing pack_tmp`);
                            exec('rm -r - f pack_tmp', () => {
                                console.log(`Done`);
                            });
                        }
                    });
                });
            });
        });
    });
});
