
var audioCtx = new(window.AudioContext || window.webkitAudioContext)();

function playNote(halftone, duration) {
  // create Oscillator node
  var oscillator = audioCtx.createOscillator();

  frequency = opensheetmusicdisplay.Pitch.calcFrequency(halftone);

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency; // value in hertz
  oscillator.connect(audioCtx.destination);
  oscillator.start();

  setTimeout(
    function() {
      oscillator.stop();
    }, duration );
}

function getAllNotesAndTime(theosmd) {
    var allNotes = [];
    const iterator = theosmd.cursor.Iterator;
    
    while(!iterator.EndReached){
       const voices = iterator.CurrentVoiceEntries;
       for(var i = 0; i < voices.length; i++){
          const v = voices[i];
          const notes = v.Notes;
          for(var j = 0; j < notes.length; j++){
                const note = notes[j];
                // make sure our note is not silent
                if(note != null && note.halfTone != 0 && !note.isRest()){
                   allNotes.push({
                      "note": note.halfTone+12, // see issue #224
                      "time": iterator.currentTimeStamp.RealValue * 4
                   })
                }
           }
        }
        iterator.moveToNext()
    }

    var notesIndex=1;
    function moveCursorAtTime() {
        if (notesIndex < allNotes.length) {
            theosmd.cursor.next();
            playNote(allNotes[notesIndex].note, 
                (allNotes[notesIndex].time - allNotes[notesIndex-1].time)*1000);
            notesIndex++;
            if (notesIndex < allNotes.length) {
                duration = (allNotes[notesIndex].time - allNotes[notesIndex-1].time)*1000;    
                setTimeout(moveCursorAtTime, duration);
            }
        }
    }

    theosmd.cursor.reset();
    theosmd.cursor.show();
    playNote(allNotes[0].note, allNotes[1].time);
    setTimeout(moveCursorAtTime, allNotes[notesIndex].time * 1000);
}

function handleFileSelect(evt) {
    var maxOSMDDisplays = 10; // how many scores can be displayed at once (in a vertical layout)
    var files = evt.target.files; // FileList object
    var osmdDisplays = Math.min(files.length, maxOSMDDisplays);

    var output = [];
    for (var i=0, file = files[i]; i<osmdDisplays; i++) {
      output.push("<li><strong>", escape(file.name), "</strong> </li>");
      output.push("<div id='osmdCanvas" + i + "'/>");
    }
    document.getElementById("list").innerHTML = "<ul>" + output.join("") + "</ul>";

    for (var i=0, file = files[i]; i < osmdDisplays; i++) {
      if (!file.name.match('.*\.xml') && !file.name.match('.*\.musicxml') && false) {
        alert('You selected a non-xml file. Please select only music xml files.');
        continue;
      }

      var reader = new FileReader();

      reader.onload = function(e) {
          var osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmdCanvas", {
            // set options here
            backend: "svg",
            drawFromMeasureNumber: 1,
            drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER // draw all measures, up to the end of the sample
          });
          osmd
            .load(e.target.result)
            .then(
              function() {
                window.osmd = osmd; // give access to osmd object in Browser console, e.g. for osmd.setOptions()
                //console.log("e.target.result: " + e.target.result);
                osmd.FollowCursor = true;
                osmd.render();
                osmd.cursor.show(); // this would show the cursor on the first note
                // osmd.cursor.next(); // advance the cursor one note
                getAllNotesAndTime(osmd);
              }
            );
      };
      if (file.name.match('.*\.mxl')) {
        // have to read as binary, otherwise JSZip will throw ("corrupted zip: missing 37 bytes" or similar)
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    }
  }

document.getElementById("files").addEventListener("change", handleFileSelect, false);
