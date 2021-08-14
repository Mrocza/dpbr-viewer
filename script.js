var page;
var index;
var data;
var paused;
var intervalId;
var column_count = 2;
var column_width = 45;
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

function start(tagstring) {
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

function redraw() {
  column_container.innerHTML = '';
  for (var i = 0; i < window.column_count; i++) {
    column_container.appendChild(createElement('div', {'class':'column'}));
  }
  var columns = document.getElementsByClassName('column')
  for (i=0; i < window.index; i++){
    var column = columns[i % columns.length]
    column.appendChild(createCard(window.data[i]));
  }
}

function getdata() {
  var url = new URL('https://derpibooru.org/api/v1/json/search/images');
  url.searchParams.set('per_page', '50');
  url.searchParams.set('page', window.page);
  url.searchParams.set('q', window.tags);
  url.searchParams.set('filter_id', '100073'); // all under 56027
  url.searchParams.set('sf', 'score');
  $.getJSON(url.href, function(APIreply) {
    if (window.data == null) {
      window.data = APIreply.images;
    }
    else {
      window.data = window.data.concat(APIreply.images)
    }
    console.log(APIreply)
    console.log('page = '+window.page)
    window.page++
    window.paused = false;
  });
}

var columns = document.getElementsByClassName('column')
function renderimage() {
  if (window.paused) return;

  let distToBottom = document.body.offsetHeight - window.scrollY - window.innerHeight;
  if (distToBottom > window.innerHeight*2) return;

  if (window.data == null || window.data[index] == undefined) {
    getdata();
    window.paused = true;
    return;
  }
  var column = columns[index % columns.length]
  column.appendChild(createCard(window.data[index]));
  window.index++;
}

function createCard(data) {
  let card = createElement('div', {'class':'card'})
  if (data.aspect_ratio < .5) card.classList.add('long');
  if (data.aspect_ratio < .1) card.classList.add('longer');
  card.style.height = 'calc(var(--column-width)/'+data.aspect_ratio+')'

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
  artist.innerHTML = data.tags.filter(isArtist);
  artist.addEventListener('click', function() {
    document.getElementById('tags').value = data.tags.filter(isArtist);
    start();
  })
  infobox.appendChild(artist);

  let content = createElement('div', {'class': 'content'});
  switch (data.representations.tall.split('.').pop()) {
    case 'png':
    case 'jpg':
    case 'gif':
      art = createElement('img', {
        'class': 'art',
        'src': data.representations.tall,
        'id': 'a'+index,
      });
      art.addEventListener('load', function(e){
        e.target.style.position = 'relative';
        document.getElementById('p'+e.target.id).remove();
      })
      preview = createElement('img', {
        'class': 'preview',
        'src': data.representations.thumb_tiny,
        'id': 'pa'+index
      });
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
      preview = createElement('video', {
        'class': 'preview',
        'src': data.representations.thumb_tiny,
        'id': 'pa'+index,
        'autoplay':'',
        'muted':'',
        'loop':''
      });
      break;
    default:
      console.log('Unknown format on '+link);
  }
  content.appendChild(art);
  content.appendChild(preview);
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
        window.scrollBy(0,1);
}
