let theWheel = {};
let globalState = {};
let includedTags = [];
let isExclusiveTag = false;
let wheelSpinning = false;
let previousIncludedTags = [];
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
    theWheel = new Winwheel({
        'numSegments'  : restaurantData.length,     // Specify number of segments.
        'outerRadius'  : 320,   // Set outer radius so wheel fits inside the background.
        'textFontSize' : 24,    // Set font size as desired.
        'segments'     :        // Define segments including colour and text.
        assignSegments(_.shuffle(restaurantData)),
        'animation' :           // Specify the animation to use.
        {
            'type'     : 'spinToStop',
            'duration' : 5,     // Duration in seconds.
            'spins'    : 8,     // Number of complete spins.
            'callbackFinished' : alertDecision
        },
        'responsive'   : true
    });
    globalState = state;
    includedTags = state.tags;
    includedTags.registerListener
    winwheelResize();
    return state;
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
    saveInLocalStorage();
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
    let newSegments = assignSegments(_.shuffle(items));

    /**
     * Winwheel doesn't seem to co-operate when deleting all segments. The following steps explain 
     * the workaround
     * 1) All segments are deleted
     * 2) If there is still a segment with a non-null value remaining at position 1, a new segment 
     *    is added and then the non-null segment is deleted
     * 3) All new relevant segments are added
     * 4) The filler segment that was added at step 2 is deleted
     */
    for(i=1; i<=theWheel.segments.length; i++) {
        theWheel.deleteSegment(i);
    }
    if (theWheel.segments[1].text != null) {
        theWheel.addSegment();
        theWheel.deleteSegment(1);
    }

    for(i=0; i<newSegments.length; i++) {
        let newSegment = theWheel.addSegment();
        newSegment.text = newSegments[i].text;
        newSegment.fillStyle = newSegments[i].fillStyle;
        newSegment.textFillStyle = newSegments[i].textFillStyle;
    }
    theWheel.deleteSegment(1); // This is important because Winwheel gets upset if the segment[0] is not null
    theWheel.rotationAngle = 0;
    theWheel.draw();
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
    adjustWheel();
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
}

const getLocalStorageData = () => {
    const lsExistingData = localStorage.getItem('CR_FW');
    let parsedStorage = null;
    if (lsExistingData != null && lsExistingData != '') {
        parsedStorage = JSON.parse(lsExistingData);
    }
    console.log('watching')
    return parsedStorage;
}

/**
 * Saves the exluded tags in localStorage to access at init next time the user visits the app
 */
const saveInLocalStorage = () => {
    const allTags = globalState.tags;
    const excludedTags = _.without(allTags, ...includedTags);
    const objExcludedTags = {excludedTags}
    localStorage.setItem('CR_FW', JSON.stringify(objExcludedTags));
}

/**
 * Checks localstorage after init and deselects tags that have been previously excluded
 * This is a dirty implementation, might need to rework later...
 */
window.setTimeout(() => {
    if (previousIncludedTags != includedTags) {
        const parsedStorage = getLocalStorageData();
        if (parsedStorage != null && Object.keys(parsedStorage).length > 0 && parsedStorage.excludedTags && parsedStorage.excludedTags.length > 0) {
            parsedStorage.excludedTags.forEach((tag) => {
                let elem = document.querySelector(`[data-tag="${tag}"]`);
                selectTag(elem);
                console.log(elem);
            })
        }
    }
    previousIncludedTags = includedTags;
}, 250);