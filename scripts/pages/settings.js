window.addEvent("domready", function () {
    // Option 1: Use the manifest:
    new FancySettings.initWithManifest(function (settings) {
        settings.manifest.button1.addEvent("action", function () {
            alert("You clicked me!");
        });
    });
    
    // Option 2: Do everything manually:
    /*
    var settings = new FancySettings("My Extension", "icon.png");
    
    var textBox1 = settings.create({
        "tab": "Information",
        "group": "Login",
        "name": "textBox1",
        "type": "text",
        "label": "Password:",
        "text": "6 - 12 characters",
        "masked": true
    });
    
    var description1 = settings.create({
        "tab": "Information",
        "group": "Login",
        "name": "description1",
        "type": "description",
        "text": "This is a description. You can write any text inside of this.<br>\
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut\
        labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores\
        et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem\
        ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et\
        dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.\
        Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
    });
    
    var button1 = settings.create({
        "tab": "Information",
        "group": "Logout",
        "name": "button1",
        "type": "button",
        "label": "Disconnect:",
        "text": "Logout"
    });
    
    // ...
    
    button1.addEvent("action", function () {
        alert("You clicked me!");
    });
    */
});
