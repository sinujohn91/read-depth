function run() {
  if (!document.querySelector('#read-depth')) {
    var div = document.createElement('div');
    div.id = 'read-depth';
    div.style.position='fixed';
    div.style.bottom = '50px';
    div.style.left="50px";
    div.style.height = '60px';
    div.style.width = '60px';
    div.style.lineHeight = '60px';
    div.style.fontFamily='helvetica';
    div.style.color="#fff";
    div.style.background="rgba(1, 151, 223, 0.89)";
    div.style.border="1px solid rgb(0, 153, 178)";
    div.style.zIndex='10';
    div.style.borderRadius = '50%';
    div.style.textAlign = 'center';
    div.innerText = '';
  }

  function getPercentage(numerator, denominator) {
    return Math.round(numerator*100/denominator);
  }

  function getMaxValue(array) {
    let maxValue = 0;
    array.forEach(val => {
      let value = parseInt(val, 10);
      if (value > maxValue) {
        maxValue = value;
      }
    });
    return maxValue;
  }

  function displayPercentage(storyElementsCount, scrolly) {
    if (storyElementsCount[0].top > scrolly) {
      div.innerText = storyElementsCount[0].percentage + '%';
      return;
    }

    for (var i = 0; i < storyElementsCount.length; i++) {
      if (storyElementsCount[i].top < scrolly && storyElementsCount[i+1] && storyElementsCount[i+1].top > scrolly) {
        div.innerText = storyElementsCount[i].percentage + '%';
        break;
      }
    }
  }

  function getStoryViewCount(storyId) {
    let shrubberyHost = `http://localhost:5001/api/hackathon/stories/${storyId}/story-elements/views?publisher-id=20`;
    return new Promise(resolve => {
      fetch(shrubberyHost, {
        method: 'GET'
      }).then((response) => {
        response.json().then((json) => {
          resolve(json.result);
        });
      });
    })
  }

  let story = document.querySelector('[data-story-content-id]');
  if (!story) {
    div.innerText = 'Story Id not found';
    return;
  }
  let storyContentId = story.dataset.storyContentId;
  let storyElements = document.querySelectorAll('[data-story-element-id]');
  let storyElementsTop = Array.prototype.slice.call(storyElements).map(se => {
    let top = se.getBoundingClientRect().top + window.scrollY;
    return {
      storyElementId: se.dataset.storyElementId,
      top
    };
  }, {});

  getStoryViewCount(storyContentId).then((result) => {
    let storyElements = result[storyContentId];
    let maxViewCount = getMaxValue(Object.values(storyElements));

    let storyElementsCount = storyElementsTop.map((storyElement) => {
      let percentage = getPercentage(storyElements[storyElement.storyElementId], maxViewCount);
      return {
        top: storyElement.top,
        percentage
      }
    });
    displayPercentage(storyElementsCount, window.scrollY);
    document.body.appendChild(div);
    document.addEventListener('scroll', () => {
      displayPercentage(storyElementsCount, window.scrollY);
    });
  });
}

function cleanUp() {
  let node = document.querySelector('#read-depth');
  if (node) {
    node.remove();
  }
}

let isOpen = false;
chrome.browserAction.onClicked.addListener(function () {
  let scriptToRun;
  isOpen = !isOpen;
  if (isOpen) {
    scriptToRun = run;
  } else {
    scriptToRun = cleanUp;
  }

  chrome.tabs.executeScript({
    code: '(' + scriptToRun + ')();'
  });
});
