
var audioCtx
var osmd

function playNote(frequency, duration) {
  // create Oscillator node
  var oscillator = audioCtx.createOscillator();

  oscillator.type = 'square';
  oscillator.frequency.value = frequency; // value in hertz
  oscillator.connect(audioCtx.destination);
  oscillator.start();

  setTimeout(
    function() {
      oscillator.stop();
      osmd.cursor.next();
    }, duration );
}

function playNotesMoveCursor() {
  if (!audioCtx) {
    audioCtx = new(window.AudioContext || window.webkitAudioContext)();
  }

  var theButton = document.getElementById("playbutton")

  iterator = osmd.cursor.Iterator
  if (!iterator.EndReached){
    voices = iterator.CurrentVoiceEntries;
    // so currently we will only play the current voice first entry of the first note
    notes = voices[0].Notes
    note = notes[0]
    console.log("=======note", note)
    noteDuration = 240000 * note.length.realValue / note.sourceMeasure.tempoInBPM
    

    if (note.pitch) {
      oscillator = audioCtx.createOscillator();
      oscillator.type = 'square';
      oscillator.connect(audioCtx.destination);
      oscillator.frequency.value = note.pitch.frequency; // value in hertz
      oscillator.start();
      // stop playing the note
      setTimeout(function() {oscillator.stop()}, noteDuration)
    }

    //process the next note when the button still is showing "Stop"
    if (theButton.innerText == "Stop") {
      setTimeout(function() {
        osmd.cursor.next()
        playNotesMoveCursor()}, noteDuration)  
    }
  } else {
    theButton.innerText = "Play"
    osmd.cursor.reset();
  }
}

function play() {
  var theButton = document.getElementById("playbutton")
  if (theButton.innerText == "Play") {
    theButton.innerText = "Stop"
    playNotesMoveCursor()
  } else {
    theButton.innerText = "Play"
  }
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
      osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmdCanvas", {
        // set options here
        backend: "svg",
        drawFromMeasureNumber: 1,
        drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER // draw all measures, up to the end of the sample
      });
      osmd.load(e.target.result)
        .then(
          function() {
            window.osmd = osmd; // give access to osmd object in Browser console, e.g. for osmd.setOptions()
            //console.log("e.target.result: " + e.target.result);
            osmd.FollowCursor = true;
            osmd.render();
            osmd.cursor.show(); // this would show the cursor on the first note
            document.getElementById("playbutton").addEventListener("click", play)
            document.getElementById("playbutton").innerHTML = "Play"

            console.log("===================osmd", osmd)
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
