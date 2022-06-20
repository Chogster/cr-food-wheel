let theWheel = {};
let globalState = {};
let includedTags = [];
let isExclusiveTag = false;
let wheelSpinning = false;
const spinBtn = document.getElementById('spin_button');

/**
 * Called at init, returns the state object to render stuff on DOM
 * @returns {Object} State object
 */
const initData = async () => {
    const fileData = await fetch('./list.json').then(res => {return res.json()});
    const restaurantData = fileData.list;
    const state = {
        "data": restaurantData,
        "tags": assignTags(restaurantData),
    };
    constructWheel(restaurantData);
    globalState = state;
    includedTags = state.tags;
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
        assignSegments(_.shuffle(segmentData)),
        'animation' :           // Specify the animation to use.
        {
            'type'     : 'spinToStop',
            'duration' : 5,     // Duration in seconds.
            'spins'    : 8,     // Number of complete spins.
            'callbackFinished' : alertDecision
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
 * Adds/removes the tag to includedTags variable, manipulates classList
 * @param {HTMLButtonElement} tagElem 
 */
const selectTag = (tagElem) => {
    const tagData = tagElem.getAttribute('data-tag');
    const isSelected = tagElem.classList.contains('selected');
    if (isSelected) {
        tagElem.classList.remove('selected');
        includedTags = _.without(includedTags, tagData);
    } else {
        tagElem.classList.add('selected');
        includedTags.push(tagData);
    }
    includedTags = _.uniq(includedTags);
    adjustWheel();
}

const adjustWheel = () => {
    let items = [];
    let excludedTags = _.difference(globalState.tags, includedTags);
    if (isExclusiveTag) {
        globalState.data.forEach(item => {
            if(_.intersection(item.tags, includedTags).length > 0 && _.intersection(item.tags, excludedTags).length === 0) {
                items.push(item);
            }
        });
    } else {
        globalState.data.forEach(item => {
            if(_.intersection(item.tags, includedTags).length > 0) {
                items.push(item);
            }
        });
    }
    _.uniq(items);
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

/**
 * Sets the exclusive tag flag
 * If true, restaurants that contain excluded tags will not be put on the wheel
 * @param {Boolean} value 
 */
const setExclusiveFlag = (value) => {
    isExclusiveTag = value;
    adjustWheel();
}

const startSpin = () => {
    if (wheelSpinning == false) {
        theWheel.animation.spins = 3;
        spinBtn.setAttribute('disabled', true);
        theWheel.startAnimation();
        wheelSpinning = true;
    }
}

const resetWheel = () => {
    theWheel.stopAnimation(false);
    theWheel.rotationAngle = 0;
    theWheel.draw();
    wheelSpinning = false;
    spinBtn.removeAttribute('disabled');
}

const getAlertTemplate = (indicatedSegment) => {
    const result = _.findWhere(globalState.data, {name: indicatedSegment.text});
    let website = result.website == null ? null : result.website;
    let note = result.note == null ? null : result.note;
    let res = `It looks like you're going to <b>${indicatedSegment.text}</b>!`;
    if (website) {
        res += `<br>Website: <a href="${website}" target="_blank">${website}</a>`;
    }
    if (note) {
        res += `<br><b>NOTE: ${note}`;
    }

    return res;
}


const alertDecision = (indicatedSegment) => {
    Swal.fire({
        title: 'Woohoo!',
        html: getAlertTemplate(indicatedSegment),
        iconHtml: '🥳',
        confirmButtonText: 'Nice',
        customClass: {
            icon: 'no-border'
        },
        confirmButtonColor: '#495867',
        isConfirmed: resetWheel()
      });
    // alert("You have won " + indicatedSegment.text);
}