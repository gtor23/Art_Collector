const BASE_URL = 'https://api.harvardartmuseums.org';
// const KEY = 'apikey=jakjk1b2j34kb32j4bkjasfd'; // USE YOUR KEY HERE
const KEY = 'apikey=c5488a90-90f1-43c5-971b-abdc690d9b4c'; // USE YOUR KEY HERE

//--------------------------------------MODULE 1-----------------------------------------------//
async function fetchObject () {
    onFetchStart();
    const url = `${ BASE_URL }/object?${ KEY }`;

    try{
        const response = await fetch(url);
        const data = await response.json();
        // console.log(response)
        return data
    }catch(error){
        console.error(error);
    }finally{
      onFetchEnd();
    }

}


async function fetchAllCenturies(){
    onFetchStart();
    const url = `${ BASE_URL }/century?${ KEY }&size=100&sort=temporalorder`;
    if (localStorage.getItem('centuries')) {
        return JSON.parse(localStorage.getItem('centuries'));
      }

    try {

      const response = await fetch(url);
      const data = await response.json();
      const records = data.records;
      localStorage.setItem('centuries', JSON.stringify(records));
    
      return records;

    } catch (error) {
      console.error(error);
    }finally{
      onFetchEnd();
    }
}


async function fetchAllClassifications(){
    onFetchStart();
    const url = `${ BASE_URL }/classification?${ KEY }&size=100&sort=name`;
    if (localStorage.getItem('classification')){
        return JSON.parse(localStorage.getItem('classification'));
    }

    try {

        const response = await fetch(url);
        const data = await response.json();
        const records = data.records;
        localStorage.setItem('classifications', JSON.stringify(records));
      
        return records;
  
      } catch (error) {
        console.error(error);
      }finally{
        onFetchEnd();
      }


}

async function prefetchCategoryLists() {
  try {
    const [
      classifications, centuries
    ] = await Promise.all([
      fetchAllClassifications(),
      fetchAllCenturies()
    ]);
    
    // This provides a clue to the user, that there are items in the dropdown
    $('.classification-count').text(`(${ classifications.length })`);

    classifications.forEach(classification => {
    // append a correctly formatted option tag into
    // the element with id select-classification

      $('#select-classification').append(`<option value="${classification.name}">${classification.name}</option>`);
    });
    
    // This provides a clue to the user, that there are items in the dropdown
    $('.century-count').text(`(${ centuries.length })`);

    centuries.forEach(century => {
    // append a correctly formatted option tag into
    // the element with id select-century

    $('#select-century').append(`<option value="${century.name}">${century.name}</option>`);

    });
    
  } 
  catch (error) {
    console.error(error);
  }
}



function buildSearchString(){


  const selectedClass = $('#select-classification').val();
  const selectedCentury = $('#select-century').val();
  const keywords = $('#keywords').val();

  const newUrl = `${BASE_URL}/object?${KEY}&classification=${selectedClass}&century=${selectedCentury}&keyword=${keywords}`;
  const encodedUrl = encodeURI(newUrl);

  return encodedUrl
}






$('#search').on('submit', async function (event) {
  // prevent the default
  event.preventDefault();
  onFetchStart();

  try {
    // get the url from `buildSearchString`
    // fetch it with await, store the result
    const url = buildSearchString();
    const response = await fetch(url);
    // log out both info and records when you get them
    
    const data = await response.json();
    //console log data here to see what we are grabbing
    updatePreview(data);
    
  } 
  catch (error) {
    // log out the error
    console.error(error);  
  }finally{
    onFetchEnd();
  }

});


function onFetchStart() {
  $('#loading').addClass('active');
}

function onFetchEnd() {
  $('#loading').removeClass('active');
}

//---------------------------------------MODULE 2---------------------------------------------------//

function renderPreview(record) {
  // grab description, primaryimageurl, and title from the record
  
  const description = record.description;
  const primaryimageurl = record.primaryimageurl;
  const title = record.title;

  /*
  Template looks like this:

  <div class="object-preview">
    <a href="#">
      <img src="image url" />
      <h3>Record Title</h3>
      <h3>Description</h3>
    </a>
  </div>

  Some of the items might be undefined, if so... don't render them

  With the record attached as data, with key 'record'
  */

  // return new element

  const objPrev = $(`
  
    <div class="object-preview">
      <a href="#">
      ${!primaryimageurl ? '' : `<img src="${primaryimageurl}" />`}
        
      ${!title ? '' : `<h3>${title}</h3>`}
              
      ${!description ? '' : `<h3>${description}</h3>`}
      </a>
    </div>
     
  `);

  objPrev.data('record', record);

  return objPrev

}


function updatePreview(result) {
   
  const root = $('#preview');
  const {info, records} = result;


  // grab the results element, it matches .results inside root
  // empty it
  // loop over the records, and append the renderPreview


  if (info.next){

    $('.next').data('url', info.next);
    $('.next').attr('disabled', false);
  }else{
    $('.next').data('url', null);
    $('.next').attr('disabled', true);
  }

  if (info.prev){

    $('.previous').data('url', info.prev);
    $('.previous').attr('disabled', false);
  }else{
    $('.previous').data('url', null);
    $('.previous').attr('disabled', true);
  }

  $('#preview .next, #preview .previous').on('click', async function () {
    /*
      read off url from the target 
      fetch the url
      read the records and info from the response.json()
      update the preview
    */

    const targetUrl =  $(this).data('url');

    try{
    onFetchStart();
    const response = await fetch(targetUrl);
    const data = await response.json();
    updatePreview(data);
    }catch(error){
      console.error(error);
    }finally{
      onFetchEnd();
    }
    
    
  });

  const elemResults = root.find('.results');

  $(elemResults).empty();
  
  records.forEach(function(record){              
    let inRec = renderPreview(record);
    $(elemResults).append(inRec);

  });

}

////---------------MODULE 3----------------------------------------------------------------

$('#preview').on('click', '.object-preview', function (event) {
  event.preventDefault(); 
  // they're anchor tags, so don't follow the link
  // find the '.object-preview' element by using .closest() from the target
  // recover the record from the element using the .data('record') we attached
  // log out the record object to see the shape of the data

  const objRec = $(this).closest('.object-preview').data('record');

  console.log(objRec);

  //NEW => set the html() on the '#feature' element to renderFeature()//
  $('#feature').html(renderFeature(objRec));

});



function renderFeature(record) {
  /**
   * We need to read, from record, the following:
   * HEADER: title, dated
   * FACTS: description, culture, style, technique, medium, dimensions, people, department, division, contact, creditline
   * PHOTOS: images, primaryimageurl
   */

  // build and return template
    const {title, dated, description, culture, style, technique, 
    medium, dimensions, people, department, division, contact, 
    creditline, images, primaryimageurl} = record

      const bar =  $(` 
      <div class="object-feature">
      <header>
      <h3>${title}</h3>
      <h4>${dated}</h4>
      </header>
      <section class="facts">
      ${description ? factHTML('Description', description) : ''}
      ${culture ? factHTML('Culture', culture, 'culture') : ''}
      ${style ? factHTML('Style', style) : ''}
      ${technique ? factHTML('Technique', technique, 'technique') : ''}
      ${medium ? factHTML('Medium', medium, 'medium') : ''}
      ${dimensions? factHTML('Dimensions', dimensions, 'dimensions') : ''}
      ${people ? people.map((person) => factHTML('Person', person.displayname, 'person')
        ).join('') : ''}
      ${department ? factHTML('Department', department) : ''}
      ${division ? factHTML('Division', division) : ''}
      ${contact ? factHTML('Contact', `<a target="_blank" href="mailto:${ contact }">${ contact }</a>`) : ''}
      ${creditline ? factHTML('Creditline', creditline) : ''}
      </section>
      <section class="photos">
        ${ images ? photosHTML(images, primaryimageurl) : '' }
      </section>
      </section>
      </div>
      `);



  return bar
}


  function searchURL(searchType, searchString) {
    return `${ BASE_URL }/object?${ KEY }&${ searchType}=${ searchString }`;
  }
  
  function factHTML(title, content, searchTerm = null) {
    // if content is empty or undefined, return an empty string ''
  
    // otherwise, if there is no searchTerm, return the two spans
  
    // otherwise, return the two spans, with the content wrapped in an anchor tag
  
    if (!content){
      return ""
    }else if (!searchTerm){
      const spans = `<span class="title">${title}</span>
      <span class="content">${content}</span>`
      
      return spans
      
    }else{
      const spans = `<span class="title">${title}</span>
      <span class="content"><a href="${searchURL(searchTerm, content)}">${content}</a></span>`
      
      return spans
    }
  
  
  }

  function photosHTML(images, primaryimageurl) {
    // if images is defined AND images.length > 0, 
    // map the images to the correct image tags, then join them into a single string.  
    // the images have a property called baseimageurl, use that as the value for src
  
    // else if primaryimageurl is defined, return a single image tag with that as value for src
  
    // else we have nothing, so return the empty string

    if(images && images.length > 0){
      return images.map((pcs) => `<img src=${pcs.baseimageurl}/>`).join('')
    }else if (primaryimageurl){
      return `<img src=${primaryimageurl}/>`
    }else{
      return ''
    }

  }
  

  $('#feature').on('click', 'a', async function (event) {
    // read href off of $(this) with the .attr() method
  
    // prevent default
  
    // call onFetchStart
    // fetch the href
    // render it into the preview
    // call onFetchEnd

    const href = $(this).attr('href')
    console.log(href)

    if (href.startsWith('mailto')) {
       return; 
      }

    event.preventDefault();
    
    onFetchStart();

    try{
      const response = await fetch(href);
      // log out both info and records when you get them
      
      const data = await response.json();
      
      updatePreview(data);

    }catch(error){
      console.error(error)
    }finally{
      onFetchEnd();
    }
  }); 





prefetchCategoryLists()




// fetchObjects().then(x => console.log(x)); // { info: {}, records: [{}, {},]}
