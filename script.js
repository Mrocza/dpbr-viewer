var page = 1;
var index;
var data;
var paused;
var intervalId;
var column_count = 2;
var column_width = 80;
let root = document.documentElement;

// artist:derekireba
// artist:holivi

$('#tags').on('change', start);
$('#column_width').on('input', function() {
  window.column_width = this.value;
  root.style.setProperty('--column-width', window.column_width/window.column_count+'vw');
});
$('#column_count').on('input', function() {
  window.column_count = this.value;
  root.style.setProperty('--column-width', window.column_width/window.column_count+'vw');
  redraw();
});


function start() {
  window.page = 1;
  window.index = 0;
  window.data = null;
  window.paused = false;
  if (window.intervalId) clearInterval(window.intervalId);
  $('#column_container').empty();
  for (var i = 0; i < window.column_count; i++) {
    $('<div>', {'class':'column'}).appendTo('#column_container');
  }
  window.tags = $( '#tags' ).val().replace(/,\s*$/, "");
  window.intervalId = window.setInterval(renderimage, 100);
}

function getdata() {
  var url = new URL('https://derpibooru.org/api/v1/json/search/images');
  url.searchParams.set('per_page', '50');
  url.searchParams.set('page', window.page);
  url.searchParams.set('q', window.tags);
  url.searchParams.set('filter_id', $('#filter_id').val()); // all under 56027
  url.searchParams.set('sf', 'score');
  $.getJSON(url.href, function(APIreply) {
    if (APIreply.images.length == 0) return;
    if (window.data == null) {
      window.data = APIreply.images;
    }
    else {
      window.data = window.data.concat(APIreply.images)
    }
    console.log(APIreply)
    window.page++
    window.paused = false;
  });
}

function redraw() {
  $('#column_container').empty();
  for (var i = 0; i < window.column_count; i++) {
    $('<div>', {'class':'column'}).appendTo('#column_container');
  }
  for (i=0; i < window.index; i++){
    getShortestColumn().appendChild(createCard(window.data[i]));
  }
}


function renderimage() {
  if (window.paused) return;

  let distToBottom = getHeightOfChildren(getShortestColumn()) - window.scrollY;
  if (distToBottom > window.innerHeight) return;

  if (window.data == null || window.data[index] == undefined) {
    getdata();
    window.paused = true;
    return;
  }
  getShortestColumn().appendChild(createCard(window.data[index]));
  window.index++;
}

function createCard(data) {
  let card = createElement('div', {'class':'card'})
  if (data.aspect_ratio < .5) card.classList.add('long');
  if (data.aspect_ratio < .1) card.classList.add('longer');

  // Building infobox
  let infobox = createElement('div', {'class':'infobox'});
  let groupLeft = createElement('div');
  infobox.appendChild(groupLeft);
  let groupCenter = createElement('div');
  infobox.appendChild(groupCenter);
  let groupRight = createElement('div');
  infobox.appendChild(groupRight);

  let score = createElement('div', {'class':'textinfo score'});
  groupLeft.appendChild(score);
  score.innerHTML = formatNumber(data.score);

  let link = createElement('a', {
    'class': 'textinfo link',
    'href': 'https://derpibooru.org/images/'+data.id,
    'target': '_blank',
    'rel':'noopener noreferrer'
  });
  groupCenter.appendChild(link);

  let artist = createElement('div', {'class':'textinfo artist dropdown'});
  var artists = data.tags.filter(isArtist);
  for (var i = 0; i < artists.length; i++) {
    artists[i] = artists[i].substring(7);
  }
  if (artists.length == 1) {
    artist.innerHTML = artists;
    artist.style.cursor = 'pointer';
    artist.style.paddingLeft = '20px';
    artist.addEventListener('click', function(e) {
      document.getElementById('tags').value = 'artist:'+e.target.innerHTML;
      start();
    });
    groupRight.appendChild(artist);
  }
  if (artists.length > 1) {
    artistList = createElement('div', {'class':'artist-list'})
    for (var i = 0; i < artists.length && i < 100; i++) {
      listItem = createElement('div', {'class':'floatinfo'});
      listItem.innerHTML = artists[i];
      listItem.addEventListener('click', function(e) {
        document.getElementById('tags').value = 'artist:'+e.target.innerHTML;
        start();
      });
      artistList.appendChild(listItem);
    }
    artist.appendChild(artistList);
    groupRight.appendChild(artist);
  }

  let tag = createElement('div', {'class':'textinfo tag dropdown'});
  var tags = data.tags.filter(isNotArtist);
  tagList = createElement('div', {'class':'tag-list'})
  for (var i = 0; i < tags.length && i < 50; i++) {
    listItem = createElement('div', {'class':'floatinfo'});
    listItem.innerHTML = tags[i];
    listItem.addEventListener('click', function(e) {
      document.getElementById('tags').value = e.target.innerHTML;
      start();
    });
    tagList.appendChild(listItem);
  }
  tag.appendChild(tagList);
  groupRight.appendChild(tag);



  // Building content
  let content = createElement('div', {'class': 'content'});
  content.style.height = 'calc(var(--column-width)/'+data.aspect_ratio+')'
  switch (data.representations.tall.split('.').pop()) {
    case 'png':
    case 'jpg':
    case 'gif':
      preview = createElement('img', {
        'class': 'preview',
        'src': data.representations.thumb_tiny,
        'loading': 'eager',
        'id': 'p'+index
      });
      content.appendChild(preview);

      art = createElement('img', {
        'class': 'art',
        'src': data.representations.tall,
        'loading': 'lazy',
        'id': 'a'+index,
      });
      art.addEventListener('load', function(e){
        // Remove preview image when main content is loaded
        document.getElementById('p'+e.target.id.substring(1)).remove();
      });
      content.appendChild(art);
      break;
    case 'mp4':
    case 'webm':
      art = createElement('video', {
        'class': 'art',
        'src': data.representations.tall,
        'id': 'a'+index,
        'autoplay':'',
        'muted':'',
        'loop':''
      });
      content.appendChild(art);
      break;
    default:
      console.log('Unknown format on '+data.id);
  }
  card.appendChild(infobox);
  card.appendChild(content);
  return card;
}

function isArtist(tag) { return tag.includes('artist:'); }
function isNotArtist(tag) { return !tag.includes('artist:'); }
function formatNumber(num) {
  if (num < 1000) return num;
  if (num < 10000) return Math.round(num/100)/10+'k';
  if (num < 1000000) return Math.round(num/1000)+'k';
  if (num < 10000000) return Math.round(num/100000)/10+'M';
  Math.round(num/1000000)+'M';
}
function createElement(element, attributes = null) {
  let output = document.createElement(element);
  if (attributes == null) return output;
  for (a in attributes) output.setAttribute(a, attributes[a]);
  return output;
}

function getShortestColumn() {
  var columns = document.getElementsByClassName('column');
  var output;
  var minHeight;
  for (i=0; i < columns.length; i++) {
    var currentHeight = getHeightOfChildren(columns[i]);
    if (minHeight == undefined) minHeight = currentHeight
    if (currentHeight <= minHeight) {
      minHeight = currentHeight;
      output = columns[i];
    }
  }
  return output;
}

function getHeightOfChildren(element) {
  var currentHeight = 0;
  for (j = 0; j < element.children.length; j++) {
    currentHeight += element.children[j].offsetHeight;
  }
  return currentHeight;
}
