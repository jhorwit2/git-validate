// Credit goes to Nathan LaFreniere <quitlahok@gmail.com> for this file, which
// was not licensed at the time of utilizing part of his source code.
// The original repository can be found here: https://github.com/nlf/git-validate


var Fs = require('fs'),
    Path = require('path');

var internals = {};

// Find the topmost parent of the given module.
function findParent(mod) {
    return mod.parent ? findParent(mod.parent) : mod;
}


// Similar to mkdir -p, recursively creates directories until `path` exists
function mkdir(path) {
    var mode = ~process.umask() & parseInt('777', 8);

    if (isDir(path)) {
        return;
    }

    try {
        Fs.mkdirSync(path, mode);
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }

        mkdir(Path.dirname(path));
        mkdir(path);
    }
}

// Given a path, determine if the path is a directory
function isDir(path) {
    try {
        var stat = Fs.statSync(path);
        return stat.isDirectory();
    }
    catch (e) {
        return false;
    }
}


// Given a starting directory, find the root of a git repository.
// In this case, the root is defined as the first directory that contains
// a directory named ".git"
//
// Returns a string if found, otherwise undefined
function findGitRoot(start) {

    start = start || Path.dirname(findParent(module).filename);
    var root;

    if (isDir(Path.join(start, '.git'))) {
        root = start;
    }
    else if (Path.dirname(start) !== start) {
        root = exports.findGitRoot(Path.dirname(start));
    }

    return root;
}

exports.installPostMergeHook = function () {
    var gitRoot = findGitRoot();

    var dest = Path.join(gitRoot, '.git', 'hooks', 'post-merge');
    var source = Path.relative(Path.dirname(dest), Path.resolve(__dirname, '..', 'bin', 'post-merge'));

    if (Fs.existsSync(dest)) {
        var linkDest = Fs.readlinkSync(dest);
        if (linkDest !== source) {
            Fs.renameSync(dest, dest + '.backup');
            Fs.symlinkSync(source, dest, 'file');
        }
    }
    else {
        console.log('doesnt exist');
        Fs.symlinkSync(source, dest, 'file');
    }
};
