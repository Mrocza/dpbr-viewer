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
  $.getJSON('https://derpibooru.org/api/v1/json/search/images', {
    'per_page': '50',
    'page': window.page,
    'q': window.tags,
    'filter_id': $('#filter_id').val(),
    'sf': 'score'
  }).done(function(APIreply) {
    if (APIreply.images.length == 0) return;
    if (window.data == null)  window.data = APIreply.images;
    else window.data = window.data.concat(APIreply.images);
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
  var card = createElement('div', {'class':'card'})
  if (data.aspect_ratio < .5) card.classList.add('long');
  if (data.aspect_ratio < .1) card.classList.add('longer');

  // Building infobox
  var infobox = createElement('div', {'class':'infobox'});
  card.appendChild(infobox);

  var groupLeft = $('<div>').appendTo(infobox);
  $('<div>', {
    html: formatNumber(data.score),
    'class':'textinfo score'
  }).appendTo(groupLeft);

  var groupCenter = $('<div>').appendTo(infobox);
  $('<a>', {
    'class': 'textinfo link',
    'href': 'https://derpibooru.org/images/'+data.id,
    'target': '_blank',
    'rel':'noopener noreferrer'
  }).appendTo(groupCenter);

  var groupRight = createElement('div');
  infobox.appendChild(groupRight);

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

  var tag = $('<div>', {'class':'textinfo tag dropdown'}).appendTo(groupRight);
  var tagList = $('<div>', {'class':'tag-list'}).appendTo(tag);
  var tags = data.tags.filter(isNotArtist);
  for (var i = 0; i < tags.length && i < 50; i++) {
    $('<div>', {
      html: tags[i],
      'class': 'floatinfo'
    }).on('click', function(e) {
      $('#tags').val(e.target.innerHTML);
      start();
    }).appendTo(tagList);
  }


  // Building content
  var content = $('<div>', {'class': 'content'}).appendTo(card);
  content.css('padding-bottom', 100/data.aspect_ratio+'%')
  switch (data.format) {
    case 'svg':
    case 'png':
    case 'jpg':
    case 'gif':
      $('<img>', {
        'class': 'art',
        'src': data.representations.medium,
        'loading': 'lazy',
      }).appendTo(content);
      break;
    case 'mp4':
    case 'webm':
      $('<video>', {
        'class': 'art',
        'src': data.representations.medium,
      }).appendTo(content);
      break;
    default:
      console.log('Unknown format "'+data.format+'" on ' + data.id);
  }

  return card;
}

function isArtist(tag) { return tag.includes('artist:'); }
function isNotArtist(tag) { return !tag.includes('artist:'); }
function formatNumber(num) {
  if (num < -1e3) return (num/1e3).toFixed(1)+'k';
  if (num <  1e3) return num;
  if (num <  1e4) return (num/1e3).toFixed(1)+'k';
  if (num <  1e6) return (num/1e3).toFixed(0)+'k';
  if (num <  1e7) return (num/1e6).toFixed(1)+'M';
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
