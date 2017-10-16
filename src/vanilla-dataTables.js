/*!
 *
 * Vanilla-DataTables
 * Copyright (c) 2015-2017 Karl Saunders (http://mobius.ovh)
 * Licensed under MIT (http://www.opensource.org/licenses/mit-license.php)
 *
 * Version: 2.0.0-alpha.19
 *
 */
(function(root, factory) {
    var plugin = "DataTable";

    if (typeof exports === "object") {
        module.exports = factory(plugin);
    } else if (typeof define === "function" && define.amd) {
        define([], factory(plugin));
    } else {
        root[plugin] = factory(plugin);
    }
})(typeof global !== 'undefined' ? global : this.window || this.global, function(plugin) {
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
            top: "dt-top",
            info: "dt-info",
            input: "dt-input",
            table: "dt-table",
            bottom: "dt-bottom",
            search: "dt-search",
            sorter: "dt-sorter",
            wrapper: "dt-wrapper",
            dropdown: "dt-dropdown",
            ellipsis: "dt-ellipsis",
            selector: "dt-selector",
            container: "dt-container",
            pagination: "dt-pagination"
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

    var isset = function(obj, prop) {
        return obj.hasOwnProperty(prop);
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
    var createElement = function(type, options) {
        var node = doc.createElement(type);
        if (options && "object" == typeof options) {
            var prop;
            for (prop in options) {
                if ("html" === prop) {
                    node.innerHTML = options[prop];
                } else {
                    if (prop in node) {
                        node[prop] = options[prop]
                    } else {
                        node.setAttribute(prop, options[prop]);
                    }
                }
            }
        }
        return node;
    };

    /**
     * Get the closest matching ancestor
     * @param  {Object}   el         The starting node.
     * @param  {Function} fn         Callback to find matching ancestor.
     * @return {Object|Boolean}      Returns the matching ancestor or false in not found.
     */
    var closest = function(el, fn) {
        return el && el !== document.body && (fn(el) ? el : closest(el.parentNode, fn));
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
                    date = moment(content, "ddd, DD MMM YYYY HH:mm:ss ZZ").format("YYYYMMDD");
                    break;
                case "MYSQL":
                    date = moment(content, "YYYY-MM-DD hh:mm:ss").format("YYYYMMDD");
                    break;
                case "UNIX":
                    date = moment(parseInt(content, 10)).unix();
                    break;
                    // User defined format using the data-format attribute or columns[n].format option
                default:
                    date = moment(content, format).format("YYYYMMDD");
                    break;
            }
        } else {
            date = new Date(content).getTime();
        }

        return date;
    };

    var Cell = function(cell, index) {
        this.node = cell;
        this.content = this.originalContent = cell.innerHTML;
        this.hidden = false;
        this.index = this.node.dataIndex = index;
        this.originalContent = this.content;
    };

    Cell.prototype.setContent = function(content) {
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
            if (index !== undefined) {
                this.isHeader = row.parentNode.nodeName === "THEAD";
            }
        }

        if (!this.isHeader && index !== undefined) {
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

                this.head = this.header.node.parentNode;

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

    Table.prototype = {
        build: function(data) {
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
        },

        addHeader: function() {
            var th = createElement("thead"),
                tr = createElement("tr");

            each(this.rows[0].cells, function(cell) {
                tr.appendChild(createElement("td"));
            });

            th.appendChild(tr);

            this.head = th;
            this.header = new Row(tr, 1);
            this.hasHeader = true;
        },

        addRow: function(row, at, update) {
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
        },

        removeRow: function(row, update) {
            if (row instanceof Row) {
                this.rows.splice(this.rows.indexOf(row), 1);

                if (update) {
                    this.update();
                }
            }
        },

        update: function(all) {
            each(this.rows, function(row, i) {
                row.index = row.node.dataIndex = i;
            });
        }
    };

    // PAGER
    var Pager = function(instance, parent) {
        this.instance = instance;
        this.parent = parent;
    };

    Pager.prototype = {
        render: function(pages) {
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
                    ul.appendChild(that.button(c, 1, o.firstText));
                }

                // prev button
                if (o.nextPrev) {
                    ul.appendChild(that.button(c, prev, o.prevText));
                }

                var pager = that.truncate();
                // append the links
                each(pager, function(btn) {
                    ul.appendChild(btn);
                });

                // next button
                if (o.nextPrev) {
                    ul.appendChild(that.button(c, next, o.nextText));
                }

                // first button
                if (o.firstLast) {
                    ul.appendChild(that.button(c, pages, o.lastText));
                }

                that.parent.appendChild(ul);
            }
        },

        truncate: function() {
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
                    pager.push(that.button(index == page ? "active" : "", index, index));
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
                            pager.push(that.button("", n + 1, n + 1));
                        } else if (index - n != 1) {
                            // Create ellipsis node
                            pager.push(that.button(o.classes.ellipsis, 0, o.ellipsisText, true));
                        }
                    }

                    pager.push(that.button(index == page ? "active" : "", index, index));
                    n = index;
                });
            }

            return pager;
        },

        button: function(className, pageNum, content, ellipsis) {
            return createElement("li", {
                class: className,
                html: !ellipsis ? '<a href="#" data-page="' + pageNum + '">' + content + "</a>" : '<span>' + content + "</span>"
            });
        }
    };

    // ROWS
    var Rows = function(instance) {
        this.instance = instance;
    };

    Rows.prototype = {
        render: function(page) {
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

            dt.emit("rows.render");
        },

        paginate: function() {
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

            // Current page maybe outside the range
            if (dt.currentPage > dt.totalPages) {
                dt.currentPage = dt.totalPages;
            }
        },

        add: function(row, at) {
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
        },

        remove: function(obj) {
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
        },

        get: function(row) {
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
        }
    };

    // COLUMNS
    var Columns = function(instance) {
        this.instance = instance;
    };

    Columns.prototype = {
        sort: function(column, direction) {

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

            if (node.hasAttribute("data-type")) {
                // Check for date format and moment.js
                if (node.getAttribute("data-type") === "date") {
                    format = false;
                    datetime = node.hasAttribute("data-format");

                    if (datetime) {
                        format = node.getAttribute("data-format");
                    }
                }
            }

            rows.sort(function(a, b) {
                a = a.cells[column].content;
                b = b.cells[column].content;

                if (datetime) {
                    a = parseDate(a, format);
                    b = parseDate(b, format);
                } else {
                    a = a.replace(/(\$|\,|\s|%)/g, "");
                    b = b.replace(/(\$|\,|\s|%)/g, "");
                }

                a = !isNaN(a) ? parseInt(a, 10) : a;
                b = !isNaN(b) ? parseInt(b, 10) : b;

                return direction === "asc" ? a > b : a < b;
            });

            dt.table.update();
            dt.update();

            dt.lastHeading = node;
            dt.lastDirection = direction;

            dt.emit("columns.sort", direction, column, node);

            classList.remove(node, "loading");
        },

        filter: function(column, query) {
            this.instance.search(query, column);
        },

        order: function(order) {
            var dt = this.instance,
                head = dt.table.header,
                rows = dt.table.rows,
                arr;
            if (isArray(order)) {
                // Reorder the header
                if (dt.table.hasHeader) {
                    arr = [];
                    each(order, function(column, i) {
                        arr[i] = head.cells[column];

                        arr[i].index = arr[i].node.dataIndex = i;

                        // rearrange the tr node cells for rendering
                        head.node.appendChild(arr[i].node);
                    });
                    head.cells = arr;
                }

                // Reorder the body
                each(rows, function(row) {
                    arr = [];
                    each(order, function(column, i) {
                        arr[i] = row.cells[column];

                        arr[i].index = arr[i].node.dataIndex = i;

                        row.node.appendChild(arr[i].node);
                    });
                    row.cells = arr;
                });

                dt.update();

                dt.emit("columns.order", order);
            }
        },

        hide: function(columns) {
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

            this.fix(true);
            dt.update();

            dt.emit("columns.hide", columns);
        },

        show: function(columns) {
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

            this.fix(true);
            dt.update();

            dt.emit("columns.show", columns);
        },

        visible: function(columns) {
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
        },

        add: function(obj) {
            var dt = this.instance;

            if (isObject(obj)) {
                if (isset(obj, "heading")) {
                    var cell = new Cell(createElement("th"), dt.table.header.cells.length);
                    cell.setContent(obj.heading);

                    dt.table.header.node.appendChild(cell.node);
                    dt.table.header.cells.push(cell);
                }

                if (isset(obj, "data") && isArray(obj.data)) {
                    each(dt.table.rows, function(row, i) {
                        var cell = new Cell(createElement("td"), row.cells.length);
                        cell.setContent(obj.data[i] || "");

                        row.node.appendChild(cell.node);
                        row.cells.push(cell);
                    });
                }
            }

            this.fix(true);
            dt.update();

            dt.emit("columns.add");
        },

        remove: function(select, hold) {
            var dt = this.instance,
                table = dt.table,
                head = table.header;

            if (isArray(select)) {
                // Remove in reverse otherwise the indexes will be incorrect
                select.sort(function(a, b) {
                    return b - a;
                });

                each(select, function(column, i) {
                    this.remove(column, i < select.length - 1);
                }, this);

                return;
            } else {
                head.node.removeChild(head.cells[select].node);
                head.cells.splice(select, 1);

                each(table.rows, function(row) {
                    row.node.removeChild(row.cells[select].node);
                    row.cells.splice(select, 1);
                });
            }

            if (!hold) {
                each(head.cells, function(cell, i) {
                    cell.index = cell.node.dataIndex = i;
                });

                each(table.rows, function(row) {
                    each(row.cells, function(cell, i) {
                        cell.index = cell.node.dataIndex = i;
                    });
                });

                this.fix(true);
                dt.update();
            }

            dt.emit("columns.remove", select);
        },

        fix: function(update) {
            var dt = this.instance,
                table = dt.table,
                head = table.header;
            if (update) {
                if (table.hasHeader && dt.config.fixedColumns) {
                    dt.columnWidths = head.cells.map(function(cell) {
                        return cell.node.offsetWidth;
                    });
                }
            }

            each(
                dt.columnWidths,
                function(size, cell) {
                    var w = size / dt.rect.width * 100;
                    head.cells[cell].node.style.width = w + "%";
                },
                this
            );
        }
    };

    // MAIN LIB
    var DataTable = function(table, config) {
        this.config = extend(defaultConfig, config);

        if (this.config.ajax) {
            var that = this,
                ajax = this.config.ajax;

            this.request = new XMLHttpRequest();

            on(this.request, "load", function(xhr) {
                if (that.request.readyState === 4) {
                    if (that.request.status === 200) {
                        var obj = {};
                        obj.data = ajax.load ? ajax.load.call(that, that.request) : that.request.responseText;

                        obj.type = "json";

                        if (ajax.content && ajax.content.type) {
                            obj.type = ajax.content.type;
                            obj = extend(obj, ajax.content);
                        }

                        that.table = new Table(table, obj.data, that);

                        that.init();
                    }
                }
            });

            this.request.open("GET", typeof ajax === "string" ? that.config.ajax : that.config.ajax.url);
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

    DataTable.prototype = {
        init: function() {

            if (this.initialised) return;

            var that = this,
                o = that.config;

            // IE detection
            that.isIE = !!/(msie|trident)/i.test(navigator.userAgent);

            that.currentPage = 1;
            that.onFirstPage = true;
            that.onLastPage = false;

            that.rows().paginate();
            that.totalPages = that.pages.length;

            that.render();

            if (o.fixedColumns) {
                that.columns().fix();
            }

            that.initExtensions();

            if (o.plugins) {
                each(o.plugins, function(options, plugin) {
                    if (that[plugin] !== undefined && typeof that[plugin] === "function") {
                        that[plugin] = that[plugin](that, options, {
                            each: each,
                            extend: extend,
                            isObject: isObject,
                            classList: classList,
                            createElement: createElement
                        });

                        // Init plugin
                        if (options.enabled && that[plugin].init && typeof that[plugin].init === "function") {
                            that[plugin].init();
                        }
                    }
                });
            }

            // Check for the columns option
            if (o.columns) {
                that.selectedColumns = [];
                that.columnRenderers = [];

                each(o.columns, function(data) {
                    // convert single column selection to array
                    if (!isArray(data.select)) {
                        data.select = [data.select];
                    }

                    if (isset(data, "render") && typeof data.render === "function") {
                        that.selectedColumns = that.selectedColumns.concat(data.select);

                        that.columnRenderers.push({
                            columns: data.select,
                            renderer: data.render
                        });
                    }

                    // Add the data attributes to the th elements
                    if (that.table.hasHeader) {
                        each(data.select, function(column) {
                            var cell = that.table.header.cells[column];

                            if (data.type) {
                                cell.node.setAttribute("data-type", data.type);
                            }
                            if (data.format) {
                                cell.node.setAttribute("data-format", data.format);
                            }
                            if (isset(data, "sortable")) {
                                cell.node.setAttribute("data-sortable", data.sortable);

                                if (data.sortable === false) {
                                    classList.remove(cell.node, o.classes.sorter);
                                }
                            }

                            if (isset(data, "hidden")) {
                                if (data.hidden !== false) {
                                    that.columns().hide(column);
                                }
                            }

                            if (isset(data, "sort") && data.select.length === 1) {
                                that.columns().sort(data.select[0], data.sort);
                            }
                        });
                    }
                });

                if (that.selectedColumns.length) {
                    each(that.table.rows, function(row) {
                        each(row.cells, function(cell) {
                            if (that.selectedColumns.indexOf(cell.index) > -1) {
                                each(that.columnRenderers, function(obj) {
                                    if (obj.columns.indexOf(cell.index) > -1) {
                                        cell.setContent(obj.renderer.call(that, cell.content, cell, row));
                                    }
                                });
                            }
                        });
                    });
                }
            }

            that.rows().render();

            that.bindEvents();

            that.initialised = true;

            setTimeout(function() {
                that.emit("init");
            }, 10);
        },

        initExtensions: function() {
            var that = this;
            var extensions = [
                "editable",
                "exportable",
                "filterable"
            ];

            each(extensions, function(extension) {
                if (that[extension] !== undefined && typeof that[extension] === "function") {
                    that[extension] = that[extension](that, that.config[extension], {
                        each: each,
                        extend: extend,
                        isObject: isObject,
                        classList: classList,
                        createElement: createElement
                    });

                    // Init extension
                    if (that[extension].init && typeof that[extension].init === "function") {
                        that[extension].init();
                    }
                }
            });
        },

        bindEvents: function() {
            var that = this,
                o = that.config;

            on(that.wrapper, "mousedown", function(e) {
                if (e.which === 1 && o.sortable && e.target.nodeName === "TH") {
                    classList.add(e.target, "loading");
                }
            });

            on(that.wrapper, "click", function(e) {
                var node = e.target;

                if (node.hasAttribute("data-page")) {
                    e.preventDefault();
                    that.page(parseInt(node.getAttribute("data-page"), 10));
                }

                if (o.sortable && node.nodeName === "TH") {
                    if (node.hasAttribute("data-sortable") && node.getAttribute("data-sortable") === "false") return false;

                    e.preventDefault();
                    that
                        .columns()
                        .sort(node.dataIndex, classList.contains(node, "asc") ? "desc" : "asc");
                }
            });

            if (o.perPageSelect) {
                on(that.wrapper, "change", function(e) {
                    var node = e.target;
                    if (
                        node.nodeName === "SELECT" &&
                        classList.contains(node, o.classes.selector)
                    ) {
                        e.preventDefault();
                        that.config.perPage = parseInt(node.value, 10);

                        if (that.selectors.length > 1) {
                            each([].slice.call(that.selectors), function(select) {
                                select.selectedIndex = node.selectedIndex;
                            });
                        }

                        that.update();
                    }
                });
            }

            if (o.searchable) {
                on(that.wrapper, "keyup", function(e) {
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
                on(that.wrapper, "mousedown", function(e) {
                    if (e.target.nodeName === "TH") {
                        e.preventDefault();
                    }
                });
            }
        },

        render: function() {

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
                inner = inner.replace(/\{select\}/g, wrap);
            } else {
                inner = inner.replace(/\{select\}/g, "");
            }

            // Searchable
            if (o.searchable) {
                var form = [
                    "<div class='", o.classes.search, "'>",
                    "<input class='", o.classes.input, "' placeholder='", o.labels.placeholder, "' type='text'>",
                    "</div>"
                ].join("");

                // Search input placement
                inner = inner.replace(/\{search\}/g, form);
            } else {
                inner = inner.replace(/\{search\}/g, "");
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

            that.selectors = that.wrapper.querySelectorAll("." + o.classes.selector)

            // Insert in to DOM tree
            that.table.node.parentNode.replaceChild(that.wrapper, that.table.node);
            that.container.appendChild(that.table.node);

            // Store the table dimensions
            that.rect = that.table.node.getBoundingClientRect();

            that.rendered = true;
        },

        update: function() {
            this.rows().paginate();
            this.rows().render();

            this.emit("update");
        },

        getInfo: function() {
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
        },

        search: function(query, column) {
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

            each(that.table.rows, function(row) {
                var inArray = that.searchData.indexOf(row) > -1;

                // Filter column
                if (column !== undefined) {
                    each(row.cells, function(cell) {
                        if (column !== undefined && cell.index == column && !inArray) {
                            if (cell.content.toLowerCase().indexOf(query) >= 0) {
                                that.searchData.push(row);
                            }
                        }
                    });
                } else {
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
                }
            });

            classList.add(that.wrapper, "search-results");

            if (!that.searchData.length) {
                classList.remove(that.wrapper, "search-results");

                that.setMessage(that.config.labels.noRows);
            } else {
                that.update();
            }

            this.emit("search", query, this.searchData);
        },

        page: function(page) {
            // We don't want to load the current page again.
            if (page == this.currentPage) {
                return false;
            }

            if (!isNaN(page)) {
                this.currentPage = parseInt(page, 10);
            }

            this.onFirstPage = this.currentPage === 1;
            this.onLastPage = this.currentPage === this.totalPages;

            if (page > this.totalPages || page < 0) {
                return false;
            }

            this.rows().render(page);

            this.emit("page", page);
        },

        import: function(options) {
            var that = this,
                obj = false;
            var defaults = {
                // csv
                lineDelimiter: "\n",
                columnDelimiter: ","
            };

            // Check for the options object
            if (!isObject(options)) {
                return false;
            }

            options = extend(defaults, options);

            if (options.data.length || isObject(options.data)) {
                // Import CSV
                if (options.type === "csv") {
                    obj = {
                        data: []
                    };

                    // Split the string into rows
                    var rows = options.data.split(options.lineDelimiter);

                    if (rows.length) {

                        if (options.headings) {
                            obj.headings = rows[0].split(options.columnDelimiter);

                            rows.shift();
                        }

                        each(rows, function(row, i) {
                            obj.data[i] = [];

                            // Split the rows into values
                            var values = row.split(options.columnDelimiter);

                            if (values.length) {
                                each(values, function(value) {
                                    obj.data[i].push(value);
                                });
                            }
                        });
                    }
                } else if (options.type === "json") {
                    var json = isJson(options.data);

                    // Valid JSON string
                    if (json) {
                        obj = {
                            headings: [],
                            data: []
                        };

                        each(json, function(data, i) {
                            obj.data[i] = [];
                            each(data, function(value, column) {
                                if (obj.headings.indexOf(column) < 0) {
                                    obj.headings.push(column);
                                }

                                obj.data[i].push(value);
                            });
                        });
                    } else {
                        console.warn("That's not valid JSON!");
                    }
                }

                if (isObject(options.data)) {
                    obj = options.data;
                }

                if (obj) {
                    each(obj.headings, function(heading, i) {
                        that.table.header.cells[i].setContent(heading);
                    });

                    this.rows().add(obj.data);
                }
            }

            return false;
        },

        setMessage: function(message) {
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
        },

        columns: function() {
            return new Columns(this);
        },

        rows: function() {
            return new Rows(this);
        },

        on: function(event, callback) {
            this.events = this.events || {};
            this.events[event] = this.events[event] || [];
            this.events[event].push(callback);
        },

        off: function(event, callback) {
            this.events = this.events || {};
            if (event in this.events === false) return;
            this.events[event].splice(this.events[event].indexOf(callback), 1);
        },

        emit: function(event) {
            this.events = this.events || {};
            if (event in this.events === false) return;
            for (var i = 0; i < this.events[event].length; i++) {
                this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        },

        destroy: function() {

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
        }
    };

    DataTable.extend = function(prop, val) {
        if (typeof val === "function") {
            DataTable.prototype[prop] = val;
        } else {
            DataTable[prop] = val;
        }
    };

    return DataTable;
});