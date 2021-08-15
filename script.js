var page;
var index;
var data;
var paused;
var intervalId;
var column_count = 2;
var column_width = 90;
var column_container = document.getElementById('column_container');
let root = document.documentElement;


document.getElementById('tags').addEventListener("keyup", function(event) {
  if (event.keyCode === 13) start();
  if (event.keyCode === 188) start();
});
document.getElementById('column_width').addEventListener('input', function() {
  window.column_width = this.value;
  root.style.setProperty('--column-width', window.column_width/window.column_count+'vw');
});
document.getElementById('column_count').addEventListener('input', function() {
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
  column_container.innerHTML = '';
  for (var i = 0; i < window.column_count; i++) {
    column_container.appendChild(createElement('div', {'class':'column'}));
  }
  window.tags = document.getElementById('tags').value.replace(/,\s*$/, "");;
  window.intervalId = window.setInterval(renderimage, 100);
}

function getdata() {
  var url = new URL('https://derpibooru.org/api/v1/json/search/images');
  url.searchParams.set('per_page', '50');
  url.searchParams.set('page', window.page);
  url.searchParams.set('q', window.tags);
  url.searchParams.set('filter_id', document.getElementById('filter_id').value); // all under 56027
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
  column_container.innerHTML = '';
  for (var i = 0; i < window.column_count; i++) {
    column_container.appendChild(createElement('div', {'class':'column'}));
  }

  for (i=0; i < window.index; i++){
    getShortestColumn().appendChild(createCard(window.data[i]));
  }
}


function renderimage() {
  if (window.paused) return;

  let distToBottom = document.body.offsetHeight - window.scrollY;
  if (distToBottom > window.innerHeight*10) return;

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
  let upvotes = createElement('div', {'class':'textinfo upvotes'});
  upvotes.innerHTML = data.upvotes;
  infobox.appendChild(upvotes);
  let downvotes = createElement('div', {'class':'textinfo downvotes'});
  downvotes.innerHTML = data.downvotes;
  infobox.appendChild(downvotes);
  let link = createElement('a', {
    'class': 'textinfo',
    'href': 'https://derpibooru.org/images/'+data.id,
    'target': '_blank',
    'rel':'noopener noreferrer'
  });
  link.innerHTML = 'view on site';
  infobox.appendChild(link);

  let artist = createElement('div', {'class':'textinfo artist'});
  var artists = data.tags.filter(isArtist);
  for (var i = 0; i < artists.length; i++) {
    artists[i] = artists[i].substring(7);
  }
  if (artists.length == 1) {
    artist.innerHTML = artists;
    artist.addEventListener('click', function() {
      document.getElementById('tags').value = artists;
      start();
    });
    infobox.appendChild(artist);
  }
  if (artists.length > 1) {
    artist.innerHTML = 'show artists';
    artistList = createElement('div', {'class':'artist-list'})
    for (var i = 0; i < artists.length && i < 200; i++) {
      listItem = createElement('div', {'class':'floatinfo'})
      listItem.innerHTML = artists[i];
      artistList.appendChild(listItem);
    }
    artist.appendChild(artistList);
    infobox.appendChild(artist);
  }


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

function isArtist(tag) {
  return tag.includes('artist:');
}

function createElement(element, attributes = null) {
  let output = document.createElement(element);
  if (attributes == null) return output;
  for (a in attributes) output.setAttribute(a, attributes[a]);
  return output;
}

function pageScroll() {
  setTimeout(function() {window.scrollBy(0,1);}, 2000)
}

function getShortestColumn() {
  var columns = document.getElementsByClassName('column');
  var output;
  var minHeight;
  for (i=0; i < columns.length; i++) {
    var currentHeight = 0;
    for (j = 0; j < columns[i].children.length; j++) {
      currentHeight += columns[i].children[j].offsetHeight;
    }
    if (minHeight == undefined) minHeight = currentHeight
    if (currentHeight <= minHeight) {
      minHeight = currentHeight;
      output = columns[i];
    }
  }
  return output;
}
