const path = require('path');
const fs = require('fs');
var beautify = require('js-beautify').js;

const args = process.argv.slice(2)

var directoryPath = args[0];
console.log("checking path", directoryPath);
if (!fs.existsSync(directoryPath)) {
  directoryPath = path.join(__dirname, args[0]);
  console.log("joining paths");
}

if (!fs.existsSync(directoryPath)) {
  console.log("Failed to locate directory");
  exit(10);
}

var backup = false;

var options = {
    "indent_size": 2,
    "indent_char": " ",
    "indent_with_tabs": false,
    "editorconfig": false,
    "eol": "\n",
    "end_with_newline": false,
    "indent_level": 0,
    "preserve_newlines": true,
    "max_preserve_newlines": 10,
    "space_in_paren": false,
    "space_in_empty_paren": false,
    "jslint_happy": false,
    "space_after_anon_function": false,
    "space_after_named_function": false,
    "brace_style": "collapse", // expand to keep opening and closing brace on same level
    "unindent_chained_methods": false,
    "break_chained_methods": false,
    "keep_array_indentation": false,
    "unescape_strings": false,
    "wrap_line_length": 0,
    "e4x": false,
    "comma_first": false,
    "operator_position": "before-newline",
    "indent_empty_lines": false
};

var processOneDir = function(directoryPath) 
{
  fs.readdir(directoryPath, function (err, files) 
  {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) 
    {
       if (file.endsWith(".js")) 
       {
          var hasBom = false;
          console.log(file); 
                    
          const filePath = path.join(directoryPath, file);
          var binary = fs.readFileSync(filePath, 'utf8');
          
          if (binary.match(/^\uFEFF/))
          {
             console.log("BOM", file);
             hasBom = true;
            // process.exit(0);
          }
          
          fs.readFile(filePath, 'utf8', function (err, data)
          {
            if (err) {
              throw err;
            }
            var fixedContent = beautify(data, options);
            //console.log(fixedContent);
            
            if (fixedContent !== data)
            {
              if (backup) fs.writeFileSync(filePath+".bak", data, 'utf8');
              
              // Custom processing.
              // remove two space everywhere if using define([..]);
              if (fixedContent.match(/^ ?define\(\[|\n ?define\(\[/) ||
                  fixedContent.match(/^ ?require\(\[|\n ?require\(\[/))
              {
                fixedContent = fixedContent.replace(/\n  /g, "\n");
                console.log("DEFINE START", file);
              }
              else
              {
                console.log("NOT DEFINE START", file);
              }
              
              // Handle UTF8 BOM
              if (hasBom) {
                fixedContent = '\ufeff' + fixedContent;
              }
              
              fs.writeFile(filePath, fixedContent, 'utf8', function(err) 
              {
                if (err) {
                  throw err;
                }
              });
            }
          });
        }
    });
    
    // process subdirs
    files.forEach(function (file) 
    {
      // Do whatever you want to do with the file
       const filePath = path.join(directoryPath, file);
       fs.stat(filePath, function(err, stat) {
         if (stat && stat.isDirectory()) {
           processOneDir(filePath);
         }
       });
     });
  });
};


processOneDir(directoryPath);

