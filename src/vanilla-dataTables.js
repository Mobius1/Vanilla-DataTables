/*!
 *
 * Vanilla-DataTables
 * Copyright (c) 2015-2017 Karl Saunders (http://mobius.ovh)
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 *
 * Version: 2.0.0-alpha.9
 *
 */
(function(root, factory) {
    var plugin = "DataTable";

    if (typeof define === "function" && define.amd) {
        define([], factory(plugin));
    } else if (typeof exports === "object") {
        module.exports = factory(plugin);
    } else {
        root[plugin] = factory(plugin);
    }
})(this, function(plugin) {
    "use strict";
    var win = window,
        doc = document,
        body = doc.body;

    /**
     * Default configuration
     * @typ {Object}
     */
    var defaultConfig = {
        perPage: 10,
        perPageSelect: [5, 10, 15, 20, 25],

        sortable: true,
        searchable: true,

        // Pagination
        nextPrev: true,
        firstLast: false,
        prevText: "&lsaquo;",
        nextText: "&rsaquo;",
        firstText: "&laquo;",
        lastText: "&raquo;",
        ellipsisText: "&hellip;",
        ascText: "▴",
        descText: "▾",
        truncatePager: true,
        pagerDelta: 2,

        fixedColumns: true,
        fixedHeight: false,

        header: true,
        footer: false,

        search: {
            includeHiddenColumns: false
        },

        classes: {
            table: "dataTable-table",
            wrapper: "dataTable-wrapper",
            container: "dataTable-container",
            top: "dataTable-top",
            bottom: "dataTable-bottom",
            info: "dataTable-info",
            dropdown: "dataTable-dropdown",
            selector: "dataTable-selector",
            pagination: "dataTable-pagination",
            input: "dataTable-input",
            search: "dataTable-search",
            ellipsis: "dataTable-ellipsis",
            sorter: "dataTable-sorter"
        },

        // Customise the display text
        labels: {
            placeholder: "Search...", // The search input placeholder
            perPage: "{select} entries per page", // per-page dropdown label
            noRows: "No entries found", // Message shown when there are no search results
            info: "Showing {start} to {end} of {rows} entries" //
        },

        // Customise the layout
        layout: {
            top: "{select}{search}",
            bottom: "{info}{pager}"
        }
    };

    /**
     * Check is item is object
     * @return {Boolean}
     */
    var isObject = function(val) {
        return Object.prototype.toString.call(val) === "[object Object]";
    };

    /**
     * Check is item is array
     * @return {Boolean}
     */
    var isArray = function(val) {
        return Array.isArray(val);
    };

    /**
     * Check for valid JSON string
     * @param  {String}   str
     * @return {Boolean|Array|Object}
     */
    var isJson = function(str) {
        var t = !1;
        try {
            t = JSON.parse(str);
        } catch (e) {
            return !1;
        }
        return !(null === t || (!isArray(t) && !isObject(t))) && t;
    };

    /**
     * Merge objects (reccursive)
     * @param  {Object} r
     * @param  {Object} t
     * @return {Object}
     */
    var extend = function(src, props) {
        for (var prop in props) {
            if (props.hasOwnProperty(prop)) {
                var val = props[prop];
                if (val && isObject(val)) {
                    src[prop] = src[prop] || {};
                    extend(src[prop], val);
                } else {
                    src[prop] = val;
                }
            }
        }
        return src;
    };

    /**
     * Iterator helper
     * @param  {(Array|Object|Number)}   arr     Any number, object, array or array-like collection.
     * @param  {Function}         fn             Callback
     * @param  {Object}           scope          Change the value of this
     * @return {Void}
     */
    var each = function(arr, fn, scope) {
        var n;

        if (isObject(arr)) {
            for (n in arr) {
                if (Object.prototype.hasOwnProperty.call(arr, n)) {
                    fn.call(scope, arr[n], n);
                }
            }
        } else if (isArray(arr)) {
            for (n = 0; n < arr.length; n++) {
                fn.call(scope, arr[n], n);
            }
        } else {
            for (n = 0; n < arr; n++) {
                fn.call(scope, n + 1, n);
            }
        }
    };

    /**
     * Create DOM element node
     * @param  {String}   a nodeName
     * @param  {Object}   b properties and attributes
     * @return {Object}
     */
    var createElement = function(a, b) {
        var d = doc.createElement(a);
        if (b && "object" == typeof b) {
            var e;
            for (e in b) {
                if ("html" === e) {
                    d.innerHTML = b[e];
                } else {
                    if (e in d) {
                        d[e] = b[e]
                    } else {
                        d.setAttribute(e, b[e]);
                    }
                }
            }
        }
        return d;
    };

    /**
     * Add event listener to target
     * @param  {Object} el
     * @param  {String} e
     * @param  {Function} fn
     */
    var on = function(el, e, fn) {
        el.addEventListener(e, fn, false);
    };

    /**
     * Remove event listener from target
     * @param  {Object} el
     * @param  {String} e
     * @param  {Function} fn
     */
    var off = function(el, e, fn) {
        el.removeEventListener(e, fn);
    };

    var empty = function(el, ie) {
        if (ie) {
            while (el.hasChildNodes()) {
                el.removeChild(el.lastChild);
            }
        } else {
            el.innerHTML = "";
        }
    };

    /**
     * classList shim
     * @type {Object}
     */
    var classList = {
        add: function(s, a) {
            if (s.classList) {
                s.classList.add(a);
            } else {
                if (!classList.contains(s, a)) {
                    s.className = s.className.trim() + " " + a;
                }
            }
        },
        remove: function(s, a) {
            if (s.classList) {
                s.classList.remove(a);
            } else {
                if (classList.contains(s, a)) {
                    s.className = s.className.replace(
                        new RegExp("(^|\\s)" + a.split(" ").join("|") + "(\\s|$)", "gi"),
                        " "
                    );
                }
            }
        },
        contains: function(s, a) {
            if (s)
                return s.classList ?
                    s.classList.contains(a) :
                    !!s.className &&
                    !!s.className.match(new RegExp("(\\s|^)" + a + "(\\s|$)"));
        }
    };

    /**
     * Create button helper
     * @param  {String}   c
     * @param  {Number}   p
     * @param  {String}   t
     * @return {Object}
     */
    var button = function(c, p, t) {
        return createElement("li", {
            class: c,
            html: '<a href="#" data-page="' + p + '">' + t + "</a>"
        });
    };

    /**
     * Use moment.js to parse cell contents for sorting
     * @param  {String} content     The datetime string to parse
     * @param  {String} format      The format for moment to use
     * @return {String|Boolean}     Datatime string or false
     */
    var parseDate = function(content, format) {
        var date = false;

        // moment() throws a fit if the string isn't a valid datetime string
        // so we need to supply the format to the constructor (https://momentjs.com/docs/#/parsing/string-format/)

        // Converting to YYYYMMDD ensures we can accurately sort the column numerically

        if (format && win.moment) {
            switch (format) {
                case "ISO_8601":
                    date = moment(content, moment.ISO_8601).format("YYYYMMDD");
                    break;
                case "RFC_2822":
                    date = moment(content, "ddd, MM MMM YYYY HH:mm:ss ZZ").format("YYYYMMDD");
                    break;
                case "MYSQL":
                    date = moment(content, "YYYY-MM-DD hh:mm:ss").format("YYYYMMDD");
                    break;
                case "UNIX":
                    date = moment(content).unix();
                    break;
                    // User defined format using the data-format attribute or columns[n].format option
                default:
                    date = moment(content, format).format("YYYYMMDD");
                    break;
            }
        }

        return date;
    };

    var Cell = function(cell, index) {
        this.node = cell;
        this.content = cell.innerHTML;
        this.hidden = false;
        this.index = this.node.dataIndex = index;
    };

    Cell.prototype.setContent = function(content) {
        this.originalContent = this.content;
        this.content = this.node.innerHTML = content;
    };

    var Row = function(row, index) {

        if (isArray(row)) {
            this.node = createElement("tr");

            each(row, function(val, i) {
                this.node.appendChild(createElement("td", {
                    html: val
                }))
            }, this);
        } else {
            this.node = row;

            this.isHeader = row.parentNode.nodeName === "THEAD";
        }

        if (!this.isHeader) {
            this.index = this.node.dataIndex = index - 1;
        }

        this.cells = [].slice.call(this.node.cells).map(function(cell, i) {
            return new Cell(cell, i, this);
        }, this);
    };

    var Table = function(table, data, instance) {
        this.node = table;

        if (typeof table === "string") {
            this.node = document.querySelector(table);
        }

        if (data) {
            this.build(data);
        }

        this.rows = [].slice.call(this.node.rows).map(function(row, i) {
            return new Row(row, i, this);
        }, this);

        this.body = this.node.tBodies[0];

        if (!this.body) {
            this.body = createElement("tbody");
            this.node.appendChild(this.body);
        }

        if (this.rows.length) {
            if (this.rows[0].isHeader) {
                this.hasHeader = true;

                this.header = this.rows[0];

                this.rows.shift();

                if (instance.config.sortable) {
                    each(this.header.cells, function(cell) {
                        classList.add(cell.node, instance.config.classes.sorter);
                    });
                }
            } else {
                this.addHeader();
            }
        }
    };

    Table.prototype.build = function(data) {
        var thead = false,
            tbody = false;

        if (data.headings) {
            thead = createElement("thead");
            var tr = createElement("tr");
            each(data.headings, function(col) {
                var td = createElement("th", {
                    html: col
                });
                tr.appendChild(td);
            });

            thead.appendChild(tr);
        }

        if (data.data && data.data.length) {
            tbody = createElement("tbody");
            each(data.data, function(rows) {
                var tr = createElement("tr");
                each(rows, function(value) {
                    var td = createElement("td", {
                        html: value
                    });
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }

        if (thead) {
            if (this.node.tHead !== null) {
                this.node.removeChild(this.node.tHead);
            }
            this.node.appendChild(thead);
        }

        if (tbody) {
            if (this.node.tBodies.length) {
                this.node.removeChild(this.node.tBodies[0]);
            }
            this.node.appendChild(tbody);
        }
    };

    Table.prototype.addHeader = function() {
        var th = createElement("thead"),
            tr = createElement("tr");

        each(this.rows[0].cells, function(cell) {
            tr.appendChild(createElement("td"));
        });

        th.appendChild(tr);

        this.header = new Row(tr, 1);
        this.hasHeader = true;
    };

    Table.prototype.addRow = function(row, at, update) {
        if (row instanceof Row) {
            this.rows.splice(at || 0, 0, row);

            // We may have a table without a header
            if (!this.hasHeader) {
                this.addHeader();
            }

            if (update) {
                this.update();
            }

            return row;
        }
    };

    Table.prototype.removeRow = function(row, update) {
        if (row instanceof Row) {
            this.rows.splice(this.rows.indexOf(row), 1);

            if (update) {
                this.update();
            }
        }
    };

    Table.prototype.update = function(data) {
        each(this.rows, function(row, i) {
            row.index = i;
        });
    };

    // PAGER
    var Pager = function(instance, parent) {
        this.instance = instance;
        this.parent = parent;
    };

    Pager.prototype.render = function(pages) {
        var that = this,
            dt = that.instance,
            o = dt.config;

        pages = pages || dt.totalPages;

        empty(that.parent, that.isIE);

        if (pages > 1) {
            var c = "pager",
                ul = createElement("ul"),
                prev = dt.onFirstPage ? 1 : dt.currentPage - 1,
                next = dt.onlastPage ? pages : dt.currentPage + 1;

            // first button
            if (o.firstLast) {
                ul.appendChild(button(c, 1, o.firstText));
            }

            // prev button
            if (o.nextPrev) {
                ul.appendChild(button(c, prev, o.prevText));
            }

            var pager = this.truncate();
            // append the links
            each(pager, function(btn) {
                ul.appendChild(btn);
            });

            // next button
            if (o.nextPrev) {
                ul.appendChild(button(c, next, o.nextText));
            }

            // first button
            if (o.firstLast) {
                ul.appendChild(button(c, pages, o.lastText));
            }

            that.parent.appendChild(ul);
        }
    };

    Pager.prototype.truncate = function() {
        var that = this,
            o = that.instance.config,
            delta = o.pagerDelta * 2,
            page = that.instance.currentPage,
            left = page - o.pagerDelta,
            right = page + o.pagerDelta,
            pages = that.instance.totalPages,
            range = [],
            pager = [],
            n;

        // No need to truncate if it's disabled
        if (!o.truncatePager) {
            each(pages, function(index) {
                pager.push(button(index == page ? "active" : "", index, index));
            });
        } else {
            if (page < 4 - o.pagerDelta + delta) {
                right = 3 + delta;
            } else if (page > pages - (3 - o.pagerDelta + delta)) {
                left = pages - (2 + delta);
            }

            // Get the links that will be visible
            for (var i = 1; i <= pages; i++) {
                if (i == 1 || i == pages || (i >= left && i <= right)) {
                    range.push(i);
                }
            }

            each(range, function(index) {
                if (n) {
                    if (index - n == 2) {
                        pager.push(button("", n + 1, n + 1));
                    } else if (index - n != 1) {
                        // Create ellipsis node
                        pager.push(button(o.classes.ellipsis, 0, o.ellipsisText));
                    }
                }

                pager.push(button(index == page ? "active" : "", index, index));
                n = index;
            });
        }

        return pager;
    };

    // ROWS
    var Rows = function(instance) {
        this.instance = instance;
    };

    Rows.prototype.render = function(page) {
        var that = this,
            dt = that.instance;
        page = page || dt.currentPage;

        empty(dt.table.body);

        if (page < 1 || page > dt.totalPages) return;

        var that = this,
            head = dt.table.header,
            fragment = document.createDocumentFragment();

        if (dt.table.hasHeader) {
            empty(head.node);
            each(head.cells, function(cell) {
                if (!cell.hidden) {
                    head.node.appendChild(cell.node);
                }
            });
        }

        if (dt.pages.length) {
            each(dt.pages[page - 1], function(row) {
                empty(row.node);

                each(row.cells, function(cell) {
                    if (!cell.hidden) {
                        row.node.appendChild(cell.node);
                    }
                });

                fragment.append(row.node);
            });
        }

        dt.table.body.appendChild(fragment);

        each(dt.pagers, function(pager) {
            pager.render();
        });

        dt.getInfo();
    };

    Rows.prototype.paginate = function() {
        var o = this.instance.config,
            rows = this.instance.table.rows,
            dt = this.instance;

        if (dt.searching && dt.searchData) {
            rows = dt.searchData;
        }

        dt.pages = rows
            .map(function(tr, i) {
                return i % o.perPage === 0 ? rows.slice(i, i + o.perPage) : null;
            })
            .filter(function(page) {
                return page;
            });

        dt.totalPages = dt.pages.length;
    };

    Rows.prototype.add = function(row, at) {
        if (isArray(row)) {
            at = at || 0;
            if (isArray(row[0])) {
                each(row, function(tr) {
                    tr = this.instance.table.addRow(new Row(tr, this.instance.table.rows.length + 1), at);
                }, this);
                // only update after adding multiple rows
                // to keep performance hit to a minimum
                this.instance.table.update();
            } else {
                row = this.instance.table.addRow(new Row(row, this.instance.table.rows.length + 1), at, true);
            }

            this.instance.update();

            return row;
        }
    };

    Rows.prototype.remove = function(obj) {
        var row = false,
            dt = this.instance;

        if (isArray(obj)) {
            // reverse order or there'll be shit to pay
            for (var i = obj.length - 1; i >= 0; i--) {
                dt.table.removeRow(this.get(obj[i]));
            }
            dt.table.update();
            dt.update();
        } else {
            if (row = this.get(obj)) {
                dt.table.removeRow(row, true);
                dt.update();

                return row;
            }
        }
    };

    Rows.prototype.get = function(row) {
        var rows = this.instance.table.rows;
        if (row instanceof Row || row instanceof Element) {
            for (var n = 0; n < rows.length; n++) {
                if (rows[n].node === row || rows[n] === row) {
                    row = rows[n];
                    break;
                }
            }
        } else {
            row = rows[row];
        }

        return row;
    };

    // COLUMNS
    var Columns = function(instance) {
        this.instance = instance;
    };

    Columns.prototype.sort = function(column, direction) {

        var dt = this.instance;

        column = column || 0;
        direction = direction || (dt.lastDirection && "asc" === dt.lastDirection ? direction = "desc" : direction = "asc");

        if (column < 0 || column > dt.table.header.cells.length - 1) {
            return false;
        }

        var node = dt.table.header.cells[column].node,
            rows = dt.table.rows;

        if (dt.searching && dt.searchData) {
            rows = dt.searchData;
        }

        // Remove class from previus column
        if (dt.lastHeading) {
            classList.remove(dt.lastHeading, dt.lastDirection);
        }

        if (dt.lastDirection) {
            classList.remove(node, dt.lastDirection);
        }

        classList.add(node, direction);

        var format, datetime;

        // Check for date format and moment.js
        if (node.getAttribute("data-type") === "date") {
            format = false;
            datetime = node.hasAttribute("data-format");

            if (datetime) {
                format = node.getAttribute("data-format");
            }
        }

        rows.sort(function(a, b) {
            a = a.cells[column].content;
            b = b.cells[column].content

            if (datetime) {
                a = parseDate(parseInt(a, 10), format);
                b = parseDate(parseInt(b, 10), format);
            } else {
                a = a.replace(/(\$|\,|\s|%)/g, "");
                b = b.replace(/(\$|\,|\s|%)/g, "");
            }

            return direction === "asc" ? a > b : a < b;
        });

        dt.update();

        dt.lastHeading = node;
        dt.lastDirection = direction;
    };

    Columns.prototype.order = function(order) {
        var dt = this.instance,
            head = dt.table.header,
            rows = dt.table.rows,
            arr;

        // Reorder the header
        if (dt.table.hasHeader) {
            arr = [];
            each(order, function(column, i) {
                arr[i] = head.cells[column];

                // rearrange the tr node cells for rendering
                head.node.appendChild(head.cells[column].node);
            });
            head.cells = arr;
        }

        // Reorder the body
        each(rows, function(row) {
            arr = [];
            each(order, function(column, i) {
                arr[i] = row.cells[column];

                row.node.appendChild(row.cells[column].node);
            });
            row.cells = arr;
        });

        dt.update();
    };

    Columns.prototype.hide = function(columns) {
        var that = this,
            dt = this.instance,
            head = dt.table.header,
            rows = dt.table.rows;

        if (!isNaN(columns)) {
            columns = [columns];
        }

        for (var n = 0; n < columns.length; n++) {
            each(head.cells, function(cell) {
                if (columns[n] == cell.index) {
                    cell.hidden = true;
                }
            });

            each(rows, function(row) {
                each(row.cells, function(cell) {
                    if (columns[n] == cell.index) {
                        cell.hidden = true;
                    }
                });
            });
        }

        this.instance.update();
    };

    Columns.prototype.show = function(columns) {
        var that = this,
            dt = this.instance,
            head = dt.table.header,
            rows = dt.table.rows;

        if (!isNaN(columns)) {
            columns = [columns];
        }

        for (var n = 0; n < columns.length; n++) {
            each(head.cells, function(cell) {
                if (columns[n] == cell.index) {
                    cell.hidden = false;
                }
            });

            each(rows, function(row) {
                each(row.cells, function(cell) {
                    if (columns[n] == cell.index) {
                        cell.hidden = false;
                    }
                });
            });
        }

        this.instance.update();
    };

    Columns.prototype.visible = function(columns) {
        var that = this,
            dt = this.instance,
            head = dt.table.header,
            cols;

        if (columns === undefined) {
            columns = head.cells.map(function(cell) {
                return cell.index;
            });
        }

        if (!isNaN(columns)) {
            cols = !head.cells[columns].hidden;
        } else if (isArray(columns)) {
            cols = [];
            each(columns, function(column) {
                cols.push(!head.cells[column].hidden);
            });
        }

        return cols;
    };

    Columns.prototype.fix = function() {
        each(
            this.instance.columnWidths,
            function(size, cell) {
                var w = size / this.instance.rect.width * 100;
                this.instance.table.header.cells[cell].node.style.width = w + "%";
            },
            this
        );
    };

    var Ajax = function(config) {
        this.config = config;
        this.request = new XMLHttpRequest();

        on(this.request, "load", this.load.bind(this));
        on(this.request, "error", this.error.bind(this));
        on(this.request, "abort", this.abort.bind(this));
        on(this.request, "progress", this.progress.bind(this));
    };

    Ajax.prototype.send = function() {
        this.request.open("GET", this.config.url);
        this.request.send();
    };

    Ajax.prototype.load = function() {
        if (this.request.readyState === 4) {
            if (this.request.status === 200) {
                if (this.config.load && typeof this.config.load === "function") {
                    this.config.load.call(this);
                }
            }
        }
    };

    Ajax.prototype.error = function() {};
    Ajax.prototype.abort = function() {};
    Ajax.prototype.progress = function() {};

    var Exporter = function(instance) {
        this.config = {
            download: true,
            skipColumns: [],

            // csv
            lineDelimiter: "\n",
            columnDelimiter: ",",

            // sql
            tableName: "myTable",

            // json
            replacer: null,
            space: 4
        };

        this.instance = instance;
    };

    Exporter.prototype.export = function(config) {
        if (config && isObject(config)) {
            this.config = extend(this.config, config);
        }
        switch (this.config.type.toLowerCase()) {
            case "json":
                this.toJSON();
                break;
            case "sql":
                this.toSQL();
                break;
            case "csv":
                this.toCSV();
                break;
        }
    };

    Exporter.prototype.toJSON = function(config) {

        if (config && isObject(config)) {
            this.config = extend(this.config, config);
        }

        this.config.type = "json";

        var str = "",
            data = [],
            o = this.config,
            table = this.instance.table;

        each(table.rows, function(row, n) {
            data[n] = data[n] || {};

            each(row.cells, function(cell, i) {
                if (!cell.hidden && o.skipColumns.indexOf(cell.index) < 0) {
                    data[n][table.header.cells[cell.index].content] = table.rows[n].cells[cell.index].content;
                }
            })
        });

        // Convert the array of objects to JSON string
        str = JSON.stringify(data, o.replacer, o.space);

        if (o.download) {
            this.string = "data:application/json;charset=utf-8," + str;
            this.download();
        }

        return str;
    };

    Exporter.prototype.toCSV = function(config) {
        if (config && isObject(config)) {
            this.config = extend(this.config, config);
        }

        this.config.type = "csv";

        var str = "",
            data = [],
            o = this.config,
            table = this.instance.table;

        each(table.rows, function(row, n) {
            data[n] = data[n] || {};

            each(row.cells, function(cell, i) {
                if (!cell.hidden && o.skipColumns.indexOf(cell.index) < 0) {
                    str += cell.content + o.columnDelimiter;
                }
            });

            // Remove trailing column delimiter
            str = str.trim().substring(0, str.length - 1);

            // Apply line delimiter
            str += o.lineDelimiter;
        });

        // Remove trailing line delimiter
        str = str.trim().substring(0, str.length - 1);

        if (o.download) {
            this.string = "data:text/csv;charset=utf-8," + str;
            this.download();
        }
    };

    Exporter.prototype.toSQL = function(config) {
        if (config && isObject(config)) {
            this.config = extend(this.config, config);
        }

        this.config.type = "sql";

        var o = this.config,
            table = this.instance.table;

        // Begin INSERT statement
        var str = "INSERT INTO `" + o.tableName + "` (";

        // Convert table headings to column names
        each(table.header.cells, function(cell) {
            if (!cell.hidden && o.skipColumns.indexOf(cell.index) < 0) {
                str += "`" + cell.content + "`,";
            }
        });

        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1);

        // Begin VALUES
        str += ") VALUES ";

        // Iterate rows and convert cell data to column values
        each(table.rows, function(row) {
            str += "(";

            each(row.cells, function(cell) {
                if (!cell.hidden && o.skipColumns.indexOf(cell.index) < 0) {
                    str += "`" + cell.content + "`,";
                }
            });

            // Remove trailing comma
            str = str.trim().substring(0, str.length - 1);

            // end VALUES
            str += "),";
        });

        // Remove trailing comma
        str = str.trim().substring(0, str.length - 1);

        // Add trailing colon
        str += ";";

        if (o.download) {
            this.string = "data:application/sql;charset=utf-8," + str;
            this.download();
        }

        return str;
    };

    Exporter.prototype.download = function(str) {

        // Download
        if (this.string) {
            // Filename
            this.config.filename = this.config.filename || "datatable_export";
            this.config.filename += "." + this.config.type;

            this.string = encodeURI(this.string);

            // Create a link to trigger the download
            var link = createElement("a");
            link.href = this.string;
            link.download = this.config.filename;

            // Append the link
            body.appendChild(link);

            // Trigger the download
            link.click();

            // Remove the link
            body.removeChild(link);
        }
    };

    // MAIN LIB
    var DataTable = function(table, config) {
        this.config = extend(defaultConfig, config);

        if (this.config.ajax) {
            var that = this;

            this.request = new Ajax({
                url: typeof ajax === "string" ? that.config.ajax : that.config.ajax.url,
                load: function() {
                    var obj = {};
                    obj.data = that.config.ajax.load ? that.config.ajax.load.call(that, this.request) : this.request.responseText;

                    obj.type = "json";

                    if (that.config.ajax.content && that.config.ajax.content.type) {
                        obj.type = that.config.ajax.content.type;
                        obj = extend(obj, that.config.ajax.content);
                    }

                    that.table = new Table(table, obj.data, that);

                    that.init();
                }
            });

            this.request.send();
        } else {
            if (this.config.data) {
                this.table = new Table(table, this.config.data, this);
            } else {
                this.table = new Table(table, false, this);
            }

            this.init();
        }
    };

    DataTable.prototype.init = function() {

        if (this.initialised) return;

        var that = this;

        // IE detection
        this.isIE = !!/(msie|trident)/i.test(navigator.userAgent);

        this.currentPage = 1;

        this.rows().paginate();
        this.totalPages = this.pages.length;

        this.render();

        if (this.config.fixedColumns) {
            this.columns().fix();
        }

        // Check for the columns option
        if (that.config.columns) {
            that.selectedColumns = [];
            that.columnRenderers = [];

            each(that.config.columns, function(data) {
                // convert single column selection to array
                if (!isArray(data.select)) {
                    data.select = [data.select];
                }

                if (data.hasOwnProperty("render") && typeof data.render === "function") {
                    that.selectedColumns = that.selectedColumns.concat(data.select);

                    that.columnRenderers.push({
                        columns: data.select,
                        renderer: data.render
                    });
                }

                // Add the data attributes to the th elements
                if (that.table.hasHeader) {
                    each(data.select, function(column) {
                        var th = that.table.header.cells[column].node;
                        if (data.type) {
                            th.setAttribute("data-type", data.type);
                        }
                        if (data.format) {
                            th.setAttribute("data-format", data.format);
                        }
                        if (data.hasOwnProperty("sortable")) {
                            th.setAttribute("data-sortable", data.sortable);
                        }

                        if (data.hasOwnProperty("hidden")) {
                            if (data.hidden !== false) {
                                that.columns().hide(column);
                            }
                        }

                        if (data.hasOwnProperty("sort") && data.select.length === 1) {
                            that.columns().sort(data.select[0], data.sort);
                        }
                    });
                }
            });

            if (that.selectedColumns.length) {
                each(that.table.rows, function(row) {
                    each(row.cells, function(cell) {
                        if (that.selectedColumns.indexOf(cell.index) > -1) {
                            each(that.columnRenderers, function(o) {
                                if (o.columns.indexOf(cell.index) > -1) {
                                    cell.setContent(o.renderer.call(that, cell.content, cell, row));
                                }
                            });
                        }
                    });
                });
            }
        }

        this.rows().render();

        this.bindEvents();

        this.initialised = true;

        var that = this;
        setTimeout(function() {
            that.emit("datatable.init");
        }, 10);
    };

    DataTable.prototype.bindEvents = function() {
        var that = this,
            o = that.config;

        on(this.wrapper, "click", function(e) {
            var node = e.target;

            if (node.hasAttribute("data-page")) {
                e.preventDefault();
                that.page(parseInt(node.getAttribute("data-page"), 10));
            }

            if (o.sortable && node.nodeName === "TH") {
                if (
                    node.hasAttribute("data-sortable") &&
                    node.getAttribute("data-sortable") === "false"
                )
                    return false;
                e.preventDefault();
                that
                    .columns()
                    .sort(node.dataIndex, classList.contains(node, "asc") ? "desc" : "asc");
            }
        });

        if (o.perPageSelect) {
            on(this.wrapper, "change", function(e) {
                if (
                    e.target.nodeName === "SELECT" &&
                    classList.contains(e.target, o.classes.selector)
                ) {
                    e.preventDefault();
                    that.config.perPage = parseInt(e.target.value, 10);

                    that.update();
                }
            });
        }

        if (o.searchable) {
            on(this.wrapper, "keyup", function(e) {
                if (
                    e.target.nodeName === "INPUT" &&
                    classList.contains(e.target, o.classes.input)
                ) {
                    e.preventDefault();
                    that.search(e.target.value);
                }
            });
        }

        if (o.sortable) {
            on(this.wrapper, "mousedown", function(e) {
                if (e.target.nodeName === "TH") {
                    e.preventDefault();
                }
            });
        }
    };

    DataTable.prototype.render = function() {

        if (this.rendered) return;

        var that = this,
            o = that.config;

        if (this.table.hasHeader && o.fixedColumns) {
            this.columnWidths = this.table.header.cells.map(function(cell) {
                return cell.node.offsetWidth;
            });
        }

        // Build
        that.wrapper = createElement("div", {
            class: o.classes.wrapper
        });

        // Template for custom layouts
        var inner = [
            "<div class='", o.classes.top, "'>", o.layout.top, "</div>",
            "<div class='", o.classes.container, "'></div>",
            "<div class='", o.classes.bottom, "'>", o.layout.bottom, "</div>"
        ].join("");

        // Info placement
        inner = inner.replace(
            "{info}",
            "<div class='" + o.classes.info + "'></div>"
        );

        // Per Page Select
        if (o.perPageSelect) {
            var wrap = [
                "<div class='", o.classes.dropdown, "'>",
                "<label>", o.labels.perPage, "</label>",
                "</div>"
            ].join("");

            // Create the select
            var select = createElement("select", {
                class: o.classes.selector
            });

            // Create the options
            each(o.perPageSelect, function(val) {
                var selected = val === o.perPage;
                var option = new Option(val, val, selected, selected);
                select.add(option);
            });

            // Custom label
            wrap = wrap.replace("{select}", select.outerHTML);

            // Selector placement
            inner = inner.replace("{select}", wrap);
        } else {
            inner = inner.replace("{select}", "");
        }

        // Searchable
        if (o.searchable) {
            var form = [
                "<div class='", o.classes.search, "'>",
                "<input class='", o.classes.input, "' placeholder='", o.labels.placeholder, "' type='text'>",
                "</div>"
            ].join("");

            // Search input placement
            inner = inner.replace("{search}", form);
        } else {
            inner = inner.replace("{search}", "");
        }

        // Add table class
        that.table.node.classList.add(o.classes.table);

        // Pagers
        each(inner.match(/\{pager\}/g), function(pager, i) {
            inner = inner.replace(
                "{pager}",
                createElement("div", {
                    class: o.classes.pagination
                }).outerHTML
            );
        });

        that.wrapper.innerHTML = inner;

        that.pagers = [].slice.call(
            that.wrapper.querySelectorAll("." + o.classes.pagination)
        );

        each(that.pagers, function(pager, i) {
            that.pagers[i] = new Pager(that, pager);
        });

        that.container = that.wrapper.querySelector("." + o.classes.container);

        that.labels = that.wrapper.querySelectorAll("." + o.classes.info);

        // Insert in to DOM tree
        that.table.node.parentNode.replaceChild(that.wrapper, that.table.node);
        that.container.appendChild(that.table.node);

        // Store the table dimensions
        that.rect = that.table.node.getBoundingClientRect();

        that.rendered = true;
    };

    DataTable.prototype.update = function() {
        this.rows().paginate();
        this.rows().render();

        this.emit("datatable.update");
    };

    DataTable.prototype.getInfo = function() {
        // Update the info
        var current = 0,
            f = 0,
            t = 0,
            items;

        if (this.totalPages) {
            current = this.currentPage - 1;
            f = current * this.config.perPage;
            t = f + this.pages[current].length;
            f = f + 1;
            items = !!this.searching ? this.searchData.length : this.table.rows.length;
        }

        if (this.labels.length && this.config.labels.info.length) {
            // CUSTOM LABELS
            var string = this.config.labels.info
                .replace("{start}", f)
                .replace("{end}", t)
                .replace("{page}", this.currentPage)
                .replace("{pages}", this.totalPages)
                .replace("{rows}", items);

            each([].slice.call(this.labels), function(label) {
                label.innerHTML = items ? string : "";
            });
        }
    };

    /**
     * Perform a search of the data set
     * @param  {string} query
     * @return {void}
     */
    DataTable.prototype.search = function(query) {
        var that = this;

        query = query.toLowerCase();

        that.currentPage = 1;
        that.searching = true;
        that.searchData = [];

        if (!query.length) {
            that.searching = false;
            classList.remove(that.wrapper, "search-results");
            that.update();

            return false;
        }

        each(that.table.rows, function(row, idx) {
            var inArray = that.searchData.indexOf(row) > -1;

            // https://github.com/Mobius1/Vanilla-DataTables/issues/12
            var match = query.split(" ").reduce(function(bool, word) {
                var includes = false;

                for (var x = 0; x < row.cells.length; x++) {
                    if (row.cells[x].content.toLowerCase().indexOf(word) > -1) {
                        if (!row.cells[x].hidden ||
                            (row.cells[x].hidden && that.config.search.includeHiddenColumns)
                        )
                            includes = true;
                        break;
                    }
                }

                return bool && includes;
            }, true);

            if (match && !inArray) {
                that.searchData.push(row);
            }
        });

        classList.add(that.wrapper, "search-results");

        if (!that.searchData.length) {
            classList.remove(that.wrapper, "search-results");

            that.setMessage(that.config.labels.noRows);
        } else {
            that.update();
        }

        this.emit("datatable.search", query, this.searchData);
    };

    /**
     * Change page
     * @param  {int} page
     * @return {void}
     */
    DataTable.prototype.page = function(page) {
        // We don't want to load the current page again.
        if (page == this.currentPage) {
            return false;
        }

        if (!isNaN(page)) {
            this.currentPage = parseInt(page, 10);
        }

        if (page > this.pages.length || page < 0) {
            return false;
        }

        this.rows().render(page);

        this.emit("datatable.page", page);
    };

    /**
     * Show a message in the table
     * @param {string} message
     */
    DataTable.prototype.setMessage = function(message) {
        var colspan = 1;

        if (this.table.rows.length) {
            colspan = this.table.rows[0].cells.length;
        }

        var node = createElement("tr", {
            html: '<td class="dataTables-empty" colspan="' +
                colspan +
                '">' +
                message +
                "</td>"
        });

        empty(this.table.body);

        this.table.body.appendChild(node);
    };

    DataTable.prototype.columns = function() {
        return new Columns(this);
    };

    DataTable.prototype.rows = function() {
        return new Rows(this);
    };

    DataTable.prototype.exporter = function(config) {
        return new Exporter(this);
    };

    /**
     * Add custom event listener
     * @param  {String} event
     * @param  {Function} callback
     * @return {Void}
     */
    DataTable.prototype.on = function(event, callback) {
        this.events = this.events || {};
        this.events[event] = this.events[event] || [];
        this.events[event].push(callback);
    };

    /**
     * Remove custom event listener
     * @param  {String} event
     * @param  {Function} callback
     * @return {Void}
     */
    DataTable.prototype.off = function(event, callback) {
        this.events = this.events || {};
        if (event in this.events === false) return;
        this.events[event].splice(this.events[event].indexOf(callback), 1);
    };

    /**
     * Fire custom event
     * @param  {String} event
     * @return {Void}
     */
    DataTable.prototype.emit = function(event) {
        this.events = this.events || {};
        if (event in this.events === false) return;
        for (var i = 0; i < this.events[event].length; i++) {
            this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    };

    DataTable.prototype.destroy = function() {

        var that = this,
            o = that.config,
            table = that.table;

        classList.remove(table.node, o.classes.table);

        each(table.header.cells, function(cell) {
            cell.node.style.width = "";
            classList.remove(cell.node, o.classes.sorter);
        });

        var frag = doc.createDocumentFragment();
        empty(table.body);

        each(table.rows, function(row) {
            frag.appendChild(row.node);
        });

        table.body.appendChild(frag);

        this.wrapper.parentNode.replaceChild(table.node, this.wrapper);

        this.rendered = false;
        this.initialised = false;
    };

    return DataTable;
});