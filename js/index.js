let theWheel = {};
let globalState = {};
let excludedTags = [];
let wheelSpinning = false;
const spinBtn = document.getElementById('spin_button');
const resetBtn = document.getElementById('reset_button');

/**
 * Called at init, returns the state object to render stuff on DOM
 * @returns {Object} State object
 */
const initData = async () => {
    const fileData = await fetch('./list.json').then(res => {return res.json()});
    const state = {
        "data": fileData.list,
        "tags": assignTags(fileData.list),
    };
    constructWheel(fileData.list);
    globalState = state;
    return state;
}

/**
 * Takes in an array of objects to construct the wheel again
 * @param {Array} segmentData 
 */
const constructWheel = (segmentData) => {
    theWheel = new Winwheel({
        'numSegments'  : segmentData.length,     // Specify number of segments.
        'outerRadius'  : 340,   // Set outer radius so wheel fits inside the background.
        'textFontSize' : 26,    // Set font size as desired.
        'segments'     :        // Define segments including colour and text.
        assignSegments(segmentData),
        'animation' :           // Specify the animation to use.
        {
            'type'     : 'spinToStop',
            'duration' : 5,     // Duration in seconds.
            'spins'    : 8,     // Number of complete spins.
            'callbackFinished' : alertPrize
        }
    });
    theWheel.draw();
}

/**
 * Please check list.json to see what the JSON structure looks like
 * @param {Object} fileData 
 * @returns {Array}
 */
const assignTags = (fileData) => {
    let res = [];
    [...fileData].forEach((obj) => {
        res = _.union(res, obj.tags)
    });
    return res;
}

/**
 * Adds/removes the tag to excludedTags variable, manipulates classList
 * @param {HTMLButtonElement} tagElem 
 */
const selectTag = (tagElem) => {
    const tagData = tagElem.getAttribute('data-tag');
    const isSelected = tagElem.classList.contains('selected');
    if (isSelected) {
        tagElem.classList.remove('selected');
        excludedTags.push(tagData);
    } else {
        tagElem.classList.add('selected');
        excludedTags = _.without(excludedTags, tagData);
    }
    excludedTags = _.uniq(excludedTags);
    adjustWheel();
}

const adjustWheel = () => {
    let items = [];
    globalState.data.forEach(item => {
        if(_.intersection(item.tags, excludedTags).length === 0) {
            items.push(item);
        }
    });
    _.uniq(items);
    console.log(items);
    constructWheel(items);
}

/**
 * Takes in an array of objects and maps styling information.
 * Please check list.json to see what the data structure looks like.
 * NOTE: The resulting object structure is different from the initial structure
 * @param {Object} dataList 
 * @returns 
 */
const assignSegments = (dataList) => {
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
    [...dataList].forEach((obj) => {
        res.push({
            'text': obj.name,
            ...colors[i%(colors.length)]
        })
        i++;
        res = _.uniq(res);
    });
    return res;
}

function startSpin()
{
    if (wheelSpinning == false) {
        theWheel.animation.spins = 3;
        spinBtn.setAttribute('disabled', true);
        theWheel.startAnimation();
        wheelSpinning = true;
    }
}

function resetWheel()
{
    theWheel.stopAnimation(false);
    theWheel.rotationAngle = 0;
    theWheel.draw();
    wheelSpinning = false;
    spinBtn.removeAttribute('disabled');
    resetBtn.setAttribute('disabled', true);
}


function alertPrize(indicatedSegment)
{
    resetBtn.removeAttribute('disabled');
    alert("You have won " + indicatedSegment.text);
}