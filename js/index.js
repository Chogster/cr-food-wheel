let theWheel = {};
const spinBtn = document.getElementById('spin_button');

const initData = async () => {
    const fileData = await fetch('./list.json').then(res => {return res.json()});
    theWheel = new Winwheel({
        'numSegments'  : fileData.list.length,     // Specify number of segments.
        'outerRadius'  : 300,   // Set outer radius so wheel fits inside the background.
        'textFontSize' : 28,    // Set font size as desired.
        'segments'     :        // Define segments including colour and text.
        assignSegments(fileData.list),
        'animation' :           // Specify the animation to use.
        {
            'type'     : 'spinToStop',
            'duration' : 5,     // Duration in seconds.
            'spins'    : 8,     // Number of complete spins.
            'callbackFinished' : alertPrize
        }
    });

    return {
        "data": fileData.list,
        "tags": assignTags(fileData.list)
    }
}

const assignTags = (fileData) => {
    let res = [];
    [...fileData].forEach((obj) => {
        res = _.union(res, obj.tags)
    });
    return res;
}

const assignSegments = (fileData) => {
    const colors = [
        {
            'fillStyle': '#ECC8AF',
            'textFillStyle': 'black'
        },
        {
            'fillStyle': '#E7AD99',
            'textFillStyle': 'black'
        },
        {
            'fillStyle': '#CE796B',
            'textFillStyle': 'white'
        },
        {
            'fillStyle': '#C18C5D',
            'textFillStyle': 'white'
        },
        {
            'fillStyle': '#495867',
            'textFillStyle': 'white'
        },
    ];
    let res = [];
    let i = 0;
    console.log(fileData);
    [...fileData].forEach((obj) => {
        res.push({
            'text': obj.name,
            ...colors[i%(colors.length+1)]
        })
        i++;
    });
    return res;
}

// Vars used by the code in this page to do power controls.
let wheelPower    = 0;
let wheelSpinning = false;

// -------------------------------------------------------
// Click handler for spin button.
// -------------------------------------------------------
function startSpin()
{
    // Ensure that spinning can't be clicked again while already running.
    if (wheelSpinning == false) {
        // Based on the power level selected adjust the number of spins for the wheel, the more times is has
        // to rotate with the duration of the animation the quicker the wheel spins.
        theWheel.animation.spins = 3;
        spinBtn.setAttribute('disabled', true);

        // Begin the spin animation by calling startAnimation on the wheel object.
        theWheel.startAnimation();

        // Set to true so that power can't be changed and spin button re-enabled during
        // the current animation. The user will have to reset before spinning again.
        wheelSpinning = true;
    }
}

// -------------------------------------------------------
// Function for reset button.
// -------------------------------------------------------
function resetWheel()
{
    theWheel.stopAnimation(false);  // Stop the animation, false as param so does not call callback function.
    theWheel.rotationAngle = 0;     // Re-set the wheel angle to 0 degrees.
    theWheel.draw();                // Call draw to render changes to the wheel.

    document.getElementById('pw1').className = "";  // Remove all colours from the power level indicators.
    document.getElementById('pw2').className = "";
    document.getElementById('pw3').className = "";

    wheelSpinning = false;          // Reset to false to power buttons and spin can be clicked again.
}

// -------------------------------------------------------
// Called when the spin animation has finished by the callback feature of the wheel because I specified callback in the parameters
// note the indicated segment is passed in as a parmeter as 99% of the time you will want to know this to inform the user of their prize.
// -------------------------------------------------------
function alertPrize(indicatedSegment)
{
    // Do basic alert of the segment text. You would probably want to do something more interesting with this information.
    spinBtn.removeAttribute('disabled');
    alert("You have won " + indicatedSegment.text);
}