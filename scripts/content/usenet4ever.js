function getHeaderFromURL(url)
{
    console.log("extracting header fom "+url);
    var regex = new RegExp("[?&]q=([^&#]*)"),
        results = regex.exec(url);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function handleAllDownloadLinks()
{
    $('body').on('click', 'img[src="http://usenet4ever.info/vb4/posten/images/nzb_link1.png"]', function(e) {
        e.preventDefault();
        $("#sabnzbdoverlay").remove();

        var url = $(this).parent('a').attr('href');
        if(url.substr(url.length - 4) == ".nzb")
        {
            addToSABnzbd($(this), url, "addurl", "", "usenet4ever");
        }
        else
        {
            var div = $(this).parent().parent();
            div.css('position','relative');
            div.append('<div id="sabnzbdoverlay" style="border:1px solid white;z-index:999;position:absolute;top: 0;"></div>');
        
            var title = $(this).parents('div.content').find('h1').text();
            //console.log('title: '+title);
            
            //if(div.text().match(/.*(passwor).*/)) alert("pass!!");
            if(div.text().match(/.*(asswor).*/g))
            {
                var pass = "";
                if (window.getSelection)
                {
                    pass = window.getSelection().toString();
                } else if (document.selection && document.selection.type != "Control")
                {
                    pass = document.selection.createRange().text;
                }
                title = title+"{{"+pass+"}}";
                //console.log("add passwort to the title: " + title);
            }
        
    
            var header = url.match("[\\?&]q=([^&#]*)");
            header = header[1];
        
            var binsearch = "http://binsearch.info/?q="+header+"&max=10&adv_age=&server #r2";
            var nzbindex = "http://nzbindex.nl/search/?q="+header+"&sort=sizedesc";
            console.log("url: "+nzbindex);
        
            $.get(nzbindex, function(data)
            {
                var results = $(data).find('#results').find('input[type="checkbox"]');
                
                if(results.length > 0)
                {
                    results.each(function() {
                        var desc = $(this).parent().next().find('label').text()+$(this).parent().next().next().text();
                        $('#sabnzbdoverlay').append('<button class="addToSABnzbd" title="'+title+'" rel="http://nzbindex.nl/download/'+$(this).val()+'/" style="padding:15px;background-repeat: no-repeat;">'+desc+'</button><br/>');
                    });
                } else {
                    $('#sabnzbdoverlay').append('<h2>  <a href="'+url+'" target="_blank">sorry bro, nix gefunden :( schau selbst</a>  </h2>');
                }

                /* binsearch
                $(data).find('input[type="checkbox"]').each(function() {
                    var desc = $(this).parent().parent().find('span.d').html();
                    $('#sabnzbdoverlay').append('<button class="addToSABnzbd" title="'+title+'" rel="http://binsearch.info/?action=nzb&'+$(this).attr("name")+'=1" style="padding:15px;background-repeat: no-repeat;">'+desc+'</button>');
                });
                */
            });
        }
        
    });
    /*
	$('img[src="http://usenet4ever.info/vb4/posten/images/nzb_link1.png"]').each(function() {
		// add button to send item to SABConnect
		var img = chrome.runtime.getURL('/images/content_icon.png');
		var link = '<button class="addToSABnzbd" style="margin:15px;" title="add to SABnzbd"><img src="'+img+'" />add to SABnzbd</button><br/>';
		$(this).parent('a').before(link);
		//$(this).parent('a').next('a.addSABnzbd').click(addToSABnzbdFromUsenet4ever);
	});
    */

    // Change the onclick handler to send to sabnzbd
    $('body').on('click','.addToSABnzbd', function() {
        var title = $(this).attr("title");
        var url = $(this).attr("rel");
        addToSABnzbd($(this), url, "addurl", title, "usenet4ever");
    });
}

Initialize( 'usenet4ever', null, function() {
	console.log("initializing usenet4ever");
	handleAllDownloadLinks();
});