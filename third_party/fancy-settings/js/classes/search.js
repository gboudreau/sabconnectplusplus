//
// Copyright (c) 2011 Frank Kohlhepp
// https://github.com/frankkohlhepp/fancy-settings
// License: LGPL v2.1
//
(function () {
    this.Search = new Class({
        "index": [],
        "groups": {},
        
        "initialize": function (search, searchResultContainer) {
            var setting,
                find;
            
            this.search = search;
            this.searchResultContainer = searchResultContainer;
            
            // Create setting for message "nothing found"
            setting = new Setting(this.searchResultContainer);
            this.nothingFound = setting.create({
                "type": "description",
                "text": (i18n.get("nothing-found") || "No matches were found.")
            });
            this.nothingFound.bundle.set("id", "nothing-found");
            
            // Create event handlers
            find = (function (event) {
                this.find(event.target.get("value"));
            }).bind(this);
            
            this.search.addEvent("keyup", (function (event) {
                if (event.key === "esc") {
                    this.reset();
                } else {
                    find(event);
                }
            }).bind(this));
            this.search.addEventListener("search", find, false);
        },
        
        "bind": function (tab) {
            tab.addEvent("click", this.reset.bind(this));
        },
        
        "add": function (setting) {
            this.index.push(setting);
        },
        
        "find": function (searchString) {
            var result,
                groupName,
                group,
                row,
                content
            
            // Reset all settings
            this.index.each(function (setting) {
                setting.bundle.inject(setting.bundleContainer);
            });
            
            // Hide all groups
            Object.each(this.groups, function (group) {
                group.dispose();
            });
            
            // Exit search mode
            if (searchString.trim() === "") {
                document.body.removeClass("searching");
                return;
            }
            
            // Or enter search mode
            document.body.addClass("searching");
            result = this.index.filter(function (setting) {
                if (setting.params.searchString.contains(searchString.trim().toLowerCase())) {
                    return true;
                }
            });
            
            result.each((function (setting) {
                var group,
                    row;
                
                // Create group if it doesn't exist already
                if (this.groups[setting.params.group] === undefined) {
                    this.groups[setting.params.group] = (new Element("table", {
                        "class": "setting group"
                    })).inject(this.searchResultContainer);
                    group = this.groups[setting.params.group];
                    
                    var row = (new Element("tr")).inject(group);
                    
                    (new Element("td", {
                        "class": "setting group-name",
                        "text": setting.params.group
                    })).inject(row);
                    
                    group.content = (new Element("td", {
                        "class": "setting group-content"
                    })).inject(row);
                } else {
                    group = this.groups[setting.params.group];
                    group.inject(this.searchResultContainer);
                }
                
                setting.bundle.inject(group.content);
            }).bind(this));
            
            if (result.length === 0) {
                this.nothingFound.bundle.addClass("show");
            } else {
                this.nothingFound.bundle.removeClass("show");
            }
        },
        
        "reset": function () {
            this.search.set("value", "");
            this.search.blur();
            this.find("");
        }
    });
}());
