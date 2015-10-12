/**
 * organization service
 */
var config = require('config');

var mongojs = require('mongojs');

var ld = require('lodash');
 	_ = require('lodash');
	_.nst = require('underscore.nest');

var DB=config.database.db;
var HOST = config.database.host;
var connection_string = HOST+'/'+DB;
var db = mongojs(connection_string, [DB]);

var winston=require('winston');
var logger = winston.loggers.get('space_log');

var targetService = require('./TargetService');

exports.findEmployeeByFirstLastName = _findEmployeeByFirstLastName;
exports.findEmployeeById = _findEmployeeById;
exports.findEmployeesByFilter = _findEmployeesByFilter;
exports.findEmployeesByFunction = _findEmployeesByFunction;
exports.findStudiosEmployees = _findStudiosEmployees;

exports.findEmployeesHistory = _findEmployeesHistory;


exports.findEmployees = _findEmployees;
exports.getTree = _getTree;
exports.getTreeHistory = _getTreeHistory;
exports.getTreeHistoryBelow = _getTreeHistoryBelow;
exports.getTreeBelow = _getTreeBelow;
exports.getEmployeesByTargetsByPeriod = _getEmployeesByTargetsByPeriod;
exports.syncEmployeeImages = _syncEmployeeImages;
exports.getOrganizationHistoryDates = _getOrganizationHistoryDates;
exports.findTarget2EmployeeMappingByPeriod = _findTarget2EmployeeMappingByPeriod;
exports.findTarget2EmployeeMappingClusteredByPeriod = _findTarget2EmployeeMappingClusteredByPeriod;
exports.getTarget2EmployeeMappingByL2TargetByPeriod = _getTarget2EmployeeMappingByL2TargetByPeriod;
exports.findOutcomesForEmployeeByPeriod = _findOutcomesForEmployeeByPeriod;
exports.getOrganizationTrend = _getOrganizationTrend;

/**
 *
 */
function _findEmployeeByFirstLastName(firstname,lastname, callback) {
	logger.debug("findEmployeeByFirstLastName first: "+firstname+", last: "+lastname);
	var organization =  db.collection('organization');
		organization.find({'First Name':firstname,'Last Name':lastname}).sort({$natural:1}, function (err, docs){
			if (err) logger.error("[ERROR] something went wrong..."+err.message);
			if (docs) logger.debug("[ok] found some stuff ... : "+JSON.stringify(docs));
			callback(err,docs[0]);
			return;
	});
}

function _findEmployeeById(employeeId, callback) {
	logger.debug("findEmployeeById ID: "+employeeId);
	var organization =  db.collection('organization');
		organization.findOne({'Employee Number':employeeId}, function (err, result){
			if (result) logger.debug("[ok] found some stuff ... : "+JSON.stringify(result));
			callback(err,result);
			return;
	});
}



function _findEmployeesByFilter(filter, callback) {
	logger.debug("findEmployeesByFilter filter: "+filter);
	var organization =  db.collection('organization');
		organization.find(filter).sort({$natural:1}, function (err, docs){
			if (docs) logger.debug("[ok] found some stuff ... : "+docs.length+" employees");
			callback(err,docs);
			return;
	});
}


function _findEmployeesByFunction(_function, callback) {
	logger.debug("findEmployeesByFunction _function: "+_function);

	var organization =  db.collection('organization');
		organization.find({'Function':_function}).sort({$natural:1}, function (err, docs){
			if (docs) logger.debug("[ok] found some stuff ... : "+docs.length+ " employees");
			callback(err,docs);
			return;
	});
}

function _findStudiosEmployees(callback) {
	logger.debug("findStudiosEmployees: ");

	var organization =  db.collection('organization');
		organization.find({$or:[{'Function':"Studios"},{'Function':"Social Gaming Ukraine"}]}).sort({$natural:1}, function (err, docs){
			if (docs) logger.debug("[ok] found some stuff ... : "+docs.length+ " employees");
			callback(err,docs);
			return;
	});
}


function _findEmployees(callback) {
	logger.debug("findEmployees: all");
	var organization =  db.collection('organization');
		organization.find({}).sort({$natural:1}, function (err, docs){
			if (docs) logger.debug("[ok] found some stuff ... : "+docs.length+" employees");
      else logger.debug("...something went wrong");
			callback(err, docs);
			return;
	});
}

function _findEmployeesHistory(date,callback) {
	logger.debug("_findEmployeesHistory: for date: "+date);
	var history =  db.collection('organizationhistory');
		history.findOne({oDate:date} , function(err , doc){
			var employees;
      if (doc){
        employees=doc.oItems;
        logger.debug("[ok] found some stuff ... : "+employees.length+" employees");
			   callback(err, employees);
         return;
      }
      else{
         logger.debug("_findEmployeesHistory...nothing found");
			   callback(err, employees);
         return;
       }

	});
}

function _findTarget2EmployeeMapping(callback) {
	_findTarget2EmployeeMappingByPeriod(targetService.getPeriod(),callback);
}

function _findTarget2EmployeeMappingByPeriod(period,callback) {
	logger.debug("findTarget2EmployeeMappingByPeriod: "+period);
	var mapping =  db.collection('target2employee'+period);
		mapping.find({}).sort({$natural:1}, function (err, docs){
			//if (docs) logger.debug("[ok] found some shit ... : "+docs);
			callback(err,docs);
			return;
	});
}

/**
gets the targets per clustered employee
*/
function _findTarget2EmployeeMappingClustered(callback) {
	_findTarget2EmployeeMappingClusteredByPeriod(targetService.getPeriod(),callback);
}

function _findTarget2EmployeeMappingClusteredByPeriod(period,callback) {
	logger.debug("findTarget2EmployeeMappingClustered");

	_findTarget2EmployeeMappingByPeriod(period,function(err,docs){
			//if (docs) logger.debug("[ok] found some shit ... : "+docs);
			docs = _.nst.nest(docs,["employeeId"])
			callback(err,docs);
			return;
	});
}


/**
gets the targets per clustered employee
*/
function _getTarget2EmployeeMappingByL2Target(L2TargetId,callback) {
	_getTarget2EmployeeMappingByL2TargetByPeriod(L2TargetId,targetService.getPeriod(),callback);
}

function _getTarget2EmployeeMappingByL2TargetByPeriod(L2TargetId,period,callback) {
	logger.debug("_getTarget2EmployeeMappingByL2Target for L2TargetId: "+L2TargetId);

	_findTarget2EmployeeMappingClusteredByPeriod(period,function(err,docs){
		_findEmployees(function(err,allEmployees){
				logger.debug("allEmployees.length: "+allEmployees.length);
				var _employees=[];
				logger.debug("docs.children length: "+docs.children.length);

				for (var i in docs.children){
					var _employee = docs.children[i];
					//logger.debug("*** _employee: "+JSON.stringify(_employee));

					var _emp = ld.findWhere(allEmployees,{"Employee Number":_employee.name});
					if (!_emp) _emp = _employee;

					var _e ={employee:_emp,outcomes:[]};
					// targets - outcomes
					for (var o in _employee.children){
						var _target = _employee.children[o];

						if (_target.targets.indexOf(L2TargetId)>-1) {
							//logger.debug("*** _target: MATCH !!!!"+_target.targets);
							_e.outcomes.push({id:_target.id,title:_target.outcomeTitle,description:_target.outcomeDescription,successCriteria:_target.successCriteria,unit:_target.unit,area:_target.area,team:_target.team,role:_target.role});
						}
					}
					_employees.push(_e);
				}
				callback(err,_employees);
				return;
		});
	})
}

function _findOutcomesForEmployee(employeeId,callback) {
	_findOutcomesForEmployeeByPeriod(employeeId,targetService.getPeriod(),callback);
}

function _findOutcomesForEmployeeByPeriod(employeeId,period,callback) {
	logger.debug("_findOutcomesForEmployee: "+employeeId+" period: "+period);

	var _outcomes =[];
	_findTarget2EmployeeMappingClusteredByPeriod(period,function(err,employees){
			var _targets=ld.findWhere(employees.children,{name:employeeId});
			if (_targets && _targets.children){
				logger.debug("_targets.children: "+_targets.children.length);
				for (var t in _targets.children){
					var _target = _targets.children[t];
					_outcomes.push({L2Targets:_target.targets,title:_target.outcomeTitle,description:_target.outcomeDescription,successCriteria:_target.successCriteria,unit:_target.unit,area:_target.area,team:_target.team,role:_target.role,employeeName:_target.employeeName});
				}
				callback(err,_outcomes);
				return;
			}
			else{
				callback(err,null);
			}
	});
}


/**
* returns target arrays and per target mapped the employees
* param target2employeeMApping (input from HR)
	[
		{employeeID:"E2988",targets:["R1.1","G1.2"]},
		{employeeID:"E2987",targets:["R1.2","G1.2"]}
	]

* return
		[
			{"R1.1":["E2988"]},
			{"R1.2":["E2987"]},
			{"G1.2":["E2988","E2987"]}
		]

param showEmployeeTree supported values are "costcenter,location,function,organization,vertical"
param showZTargetTree supported values are "theme,group,cluster"
*/
function _getEmployeesByTargets(target2employeeMapping,pickL2,showTargetTree,showEmployeeTree,callback){
	_getEmployeesByTargetsByPeriod(target2employeeMapping,pickL2,showTargetTree,showEmployeeTree,targetService.getPeriod(),callback);
}
function _getEmployeesByTargetsByPeriod(target2employeeMapping,pickL2,showTargetTree,showEmployeeTree,period,callback) {
	logger.debug("getEmployeesByTargets for mapping");
	var _showTargetTree;
	var _showEmployeeTree;
	if (showTargetTree) _showTargetTree=showTargetTree.split(",");
	if (showEmployeeTree) _showEmployeeTree=showEmployeeTree.split(",");



	var _context="bpty.studios";
	_findEmployees(function(err,employees){
		targetService.getL2ByPeriod(_context,period,function(err,targets){
			logger.debug("************ L2Targets: "+targets.length);
			var _targets=[];
			for (var i in target2employeeMapping){
				var _map = target2employeeMapping[i];
				for (var t in _map.targets){
					if (_targets.indexOf(_map.targets[t])<0){
					//if (!ld.findWhere(_targets,{"id":_map.targets[t]})){
						var _targetId = _map.targets[t];
						logger.debug("_targetId: "+_targetId);
						//var _t = ld.findWhere(targets,{"id":_targetId});
						_targets.push(_targetId);
					}
				}
			}
			logger.debug("************ mapped targets: "+_targets.length);

			var _data=[];

			for (var t in _targets){
				var _target = ld.findWhere(targets,{"id":_targets[t]});
				logger.debug("--- find target: "+_targets[t]);
				if (_target){
					var _targetId = _target.id;
					for (var m in target2employeeMapping){
						var _map = target2employeeMapping[m];
						if (_map.targets.indexOf(_targetId)>-1){

							if (!ld.findWhere(_data,{"name":_targetId})){
								// this has to be done for a new target
								_data.push({name:_targetId,theme:_target.theme,cluster:_target.cluster,group:_target.group,target:_target.target,type:"L2target",children:[]});
							}
							var _targetBucket = ld.findWhere(_data,{"name":_targetId});
							// do some enriching from org collection
							var _employee = ld.findWhere(employees,{"Employee Number":_map.employeeId});
							var _costCenter;
							var _location;
							var _function;

							if (_employee){
								_costcenter = _employee["Cost Centre"];
								_location = _employee["Location"];
								_function = _employee["Function"];
								_organization = _employee["Organization"];
								_vertical = _employee["Vertical"];
							}

							// check whether this employee is already in
							if (!ld.findWhere(_target.children,{"id":_map.employeeId})){
								_targetBucket.children.push({id:_map.employeeId,name:_map.employeeName,location:_location,function:_function,costCenter:_costcenter,vertical:_vertical,organization:_organization});
							}
						}
					} // end if (_target)
				}
			}

			//var _showTargetTree=["theme"];
			//var _showEmployeeTree=["costCenter"];
			//var pickL2 = "G1.1";

			logger.debug("+++++++++++++++ showEmployeeTree: "+showEmployeeTree);
			logger.debug("+++++++++++++++ showTargetTree: "+showTargetTree);

			if (pickL2){
				_data = ld.where(_data,{"name":pickL2});
			}

			_.nst = require('underscore.nest');

			if (_showEmployeeTree){
				//for every target
				for (var t in _data){
					// we go over every employee per target
					_data[t].children = _.nst.nest(_data[t].children,_showEmployeeTree).children;
				}
			}
			if (_showTargetTree){
					var _data = _.nst.nest(_data,_showTargetTree).children;
			}
			var _results = [];
			// adding the root node
			if (!pickL2){
				var _context = "bpty.studios";
				// tha root
				_results.push({name:_context,children:_data})
			}
			else{
				logger.debug("***************** _data: "+JSON.stringify(_data));
				var _pickedTarget = ld.findWhere(targets,{"id":pickL2});
				if (_pickedTarget){
					var _context = _pickedTarget.theme;
					_results.push({name:_context,children:_data})
				}
			}
			callback(err,_results);
		})
	})
}



/**
 * http://my.bwinparty.com/api/people/images/e1000
 */
function _syncEmployeeImages(filter,callback) {
	var fs = require('fs');
  var request = require('request');

	logger.debug("***** sync....");

	var organization =  db.collection('organization');
		organization.find(filter).sort({$natural:1}, function (err, docs){
			if (docs){
				for (var employee in docs){
					logger.debug(employee+" :  E: "+docs[employee]["First Name"]+" "+docs[employee]["Last Name"]);
					var _id = docs[employee]["Employee Number"];
					var _imageURL = "http://my.bwinparty.com/api/people/images/";
					// [TODO]
					// 1) detect type (PngService.detectType)
					// 2) convert everything to png which is not png
					// 3) squarifyandcirclecrop

					//Lets define a write stream for our destination file
					var destination = fs.createWriteStream('./temp/'+_id);
					//Lets save the modulus logo now
					request(_imageURL+_id)
					.pipe(destination)
					.on('error', function(error){
					    console.log(error);
					});

					/*
					download(_imageURL, _id+'.png', function(){
					  console.log('done: '+_id);
					});
					*/
				}
				callback(null,"done");
			}

		});
	}


/**
 * organization snapsho dates
 * => should be moved in a service class ;-)
 */
function _getOrganizationHistoryDates(callback){
   db.collection("organizationhistory").find({},{oDate:1}).sort({oDate:-1},function(err,data){
			logger.debug("OrganizationService.getOrganizationHistoryDates(): ");
			if (err) {
				logger.warn("error: "+err);
				callback(err);
			}

			else callback(null,data);
	});
}

function _createTree(employees){
  var _name = "Employee Number";
  var _parent = "Supervisor Employee Number";

    /*
		//alternative parent dimension
		var _parent,_parentFallback;
		if (HIERARCHY_TYPE=="hr") _parent = "Supervisor Employee Number";
		else if (HIERARCHY_TYPE=="bp") {
			_parent = "Business Process Flow Manager Employee Number";
			_parentFallback = "Supervisor Employee Number";
		}

		var _list = createList(orgData,"Employee Number",_parent,_parentFallback);
		_tree = makeTree(_list);
    */


  var _list = _createList(employees,_name,_parent);
	var _tree = _makeTree(_list);

  return _tree;
}


/**could be that multiple roots exist in orgchart
* this helper methods returns the one specified by name, value
* eg norbert teufelberger has job = "CEO"
*/
function _getRootBy(name,value,tree){
  var _root;
  for (var t in tree){
    logger.debug("++++"+tree[t].name);
    if (tree[t][name]==value){
      _root= tree[t];
    }
  }
  return _root;
}

/**
* orchestration function
* @param employees: flat list of orgchart data
* @param belowRoot: object with name, value which specifies the search critera for alternate root node
*/
function _buildTree(employees,belowRoot){
  var _tree = _getRootBy("job","CEO",_createTree(employees));
  //other root the top node
  if (belowRoot){
    _tree = _searchTreeBy(_tree,belowRoot.name,belowRoot.value);
  }

  if (_tree){
    var _total = _count(_tree,0);
    _enrich(_tree);
    var statLevels = _calculateTreeStats(_tree);
    var _overall = _calculateLevelStats(_tree,statLevels);
    return {tree:_tree,stats:{levels:statLevels,overAll:_overall,total:_total}};
  }
  else return false
}

function _getTree (callback){
	_findEmployees(function(err,employees){
    var _tree = _buildTree(employees);
    if (_tree) callback(null,_tree);
    else callback({message:"no tree found..."},null);
  })
}

function _getTreeHistory (date,callback){
	_findEmployeesHistory(date,function(err,employees){
    var _tree = _buildTree(employees);
    if (_tree) callback(null,_tree);
    else callback({message:"no tree found..."},null);
  })
}

function _getTreeBelow (name,callback){
  _findEmployees(function(err,employees){
    var _tree = _buildTree(employees,{name:"employee",value:name});
    if (_tree) callback(null,_tree);
    else callback({message:"no tree found..."},null);
  })
}

function _getTreeHistoryBelow (date,name,callback){
  _findEmployeesHistory(date,function(err,employees){
    var _tree = _buildTree(employees,{name:"employee",value:name});
    if (_tree) callback(null,_tree);
    else callback({message:"no tree found..."},null);
  })
}


function _getOrganizationTrend(filter,callback){
	db.collection("organizationhistory").find(filter).sort({oDate:1},function(err,data){
			if (err) {
				logger.error("error: "+err);
				callback(err);
			}
			var _trend=[];

			logger.debug("org data items: "+data.length);
			for (var o in data){
				var _org =data[o];
				logger.debug("*** oDate:"+_org.oDate);
				var _orgmetric={};
				_orgmetric.total=_org.oItems.length;

				if (data[o-1]) _orgmetric.delta=_orgmetric.total-_trend[o-1].total;
				_orgmetric.date=_org.oDate;

				var _tfunction;
				var _tvertical;
				var _tlocation;
				var _tcostcenter;
				if (_trend[o-1]) {
					_tfunction = _trend[o-1].function;
					_tvertical = _trend[o-1].vertical;
					_tlocation = _trend[o-1].location;
					_tcostcenter = _trend[o-1].costcenter;
				}
				_orgmetric.function=_groupByAttribute(_org.oItems,"Function",_tfunction);
				_orgmetric.vertical=_groupByAttribute(_org.oItems,"Vertical",_tvertical);
				_orgmetric.location=_groupByAttribute(_org.oItems,"Location",_tlocation);
				_orgmetric.costcenter=_groupByAttribute(_org.oItems,"Cost Centre",_tcostcenter);

				_trend.push(_orgmetric);
			}
			callback(null,_trend.reverse());
	});
}

function _groupByAttribute(list,attribute,previous){
	//logger.debug("---------------- "+o);

	var _attributes = ld.groupBy(list,function(n){return n[attribute];})
	var _attributelist=[]
	var _sum = 0;
	ld.forEach(_attributes,function(value,key){
		var _a ={};
		_a.name=key;
		_a.sum = value.length;
		_sum+=value.length;
		if (previous && ld.findWhere(previous,{"name":key})){
			_a.delta=_a.sum-ld.findWhere(previous,{"name":key}).sum;
		}
		_attributelist.push(_a);
	})
	return _attributelist;
}

/**
 * prepares the flat array for input into tree creation
 * @param:name defines the mapping attribute for name
 * @param:parent defines the mapping attribute for parent
 * @param:parentBase: fallback if parent has no value
 * */
function _createList(data,name,parent,parentBase){
	var _list = new Array();
	var i=0;
	for (d in data){
		var row ={};
		row["name"]=data[d][name];
		row["parent"]=data[d][parent]?data[d][parent]:data[d][parentBase];

		row["employee"]=data[d]["First Name"]+" "+data[d]["Last Name"];;//data[d]["Full Name"];
		row["supervisor"]=data[d][parent];
    row["supervisorName"]=data[d]["Supervisor Full Name"];

		row["function"]=data[d]["Function"];
		row["position"]=data[d]["Position"];
		row["vertical"]=data[d]["Vertical"];
		row["location"]=data[d]["Location"];
		row["costcenter"]=data[d]["Cost Centre"];
    row["legalentity"]=data[d]["Employing Legal Entity"];
    row["contract"]=data[d]["Contract Type"];

		row["gender"]=data[d]["Gender"];
		row["ageYears"]=((new Date() - new Date(data[d]["Date Of Birth"]))/(1000*60*60*24*365)).toFixed(1);
		row["companyYears"]=((new Date() - new Date(data[d]["Date Of Entry"]))/(1000*60*60*24*365)).toFixed(1);
		row["terminationDate"]=data[d]["Actual Termination Date"];

		row["jobTitle"]=data[d]["Corporate Job Title"];
		row["jobTitleLocal"]=data[d]["Local Job Title"];
		row["jobTitle"]=data[d]["Corporate Job Title"];
		row["job"]=data[d]["Job"];

		row["scrum1"]=data[d]["Scrum Team 1"];
		row["scrumMaster"]=data[d]["Scrum Master Name"];
		row["contractType"]=data[d]["Contract Type"];
		row["dateHired"]=data[d]["Date Of Entry"];
		row["dateTermination"]= data[d]["Actual Termination Date"];

		_list.push(row);
	}
  logger.debug("_createList [DONE]: "+_list.length);
	return _list;
}


/**
 * builds a tree structure from flat array which has parent information
*/
function _makeTree(data){
	// *********** Convert flat data into a nice tree ***************
	// create a name: node map
	var dataMap = data.reduce(function(map, node) {
		map[node.name] = node;
		return map;
	}, {});

	// create the tree array
	var treeData = [];
	data.forEach(function(node) {
		// add to parent
		//console.log("------------------------  [forEach] node:"+JSON.stringify(node));
		var parent = dataMap[node.parent];
		//console.log("[parent]:"+JSON.stringify(parent));
		if (parent) {
			// create child array if it doesn't exist
			(parent.children || (parent.children = []))
				// add node to child array
				.push(node);
		} else {
  		//console.log("******************************** no parent found - push to treeData !!!");//+JSON.stringify(node));
  		// parent is null or missing
  		treeData.push(node);
		}
	});
	//console.log("[treeData]: "+treeData.length);

	return treeData;
}

/**
 * calculates the total cumulative "weight" (=sum of all descendants in a tree)
 * and attaches this as attribute "sumDescendants" in the array
 */
function _count(tree,sum){
	//console.log("(debug)...in count: "+tree.name);
	if (!tree.children){
		//console.log("-- leaf: "+tree.name+" supervisor: "+tree.parent.name+"  has "+tree.parent.children.length+" direct reports");
		//console.log("-- leaf: "+tree.name+" supervisor: "+tree.parent);
    return 1;
	}

	var _s =1;
	var _leafOnly=0;
	for (var c in tree.children){
		_s+=_count(tree.children[c],sum);
		if (!tree.children[c].children) _leafOnly+=1;
	}
	var _overall=sum+_s-1;
	tree.overallReports=_overall;
	tree.leafOnlyReports=_leafOnly;

	tree.directReports=tree.children.length;
	tree.averageSubordinates = Math.round((_overall-tree.directReports)/tree.directReports);

	//console.log(tree.name+" (level: "+tree.depth+" - has: "+tree.children.length+" children"+" ...overall below reports: = "+(_overall));
	return (sum+_s);
}


/** after count we can enrich
 */
function _enrich(tree,level,orgTree){
	var orgTree;
  //console.log("*start enrich...");
	if (!level){
    level=0;
    orgTree=tree;
  }
	tree.level=level;

	if (!tree.children) return level ;
	else level++;
	for (var c in tree.children){
		_enrich(tree.children[c],level,orgTree);
	}

	// at this point we just have "text reference" to parent, not yet an object ....
	//console.log("...looking for parent: "+tree.parent);
  var _parent = _searchTreeBy(orgTree,"name",tree.parent);

	if (_parent){
		tree.averageDeviation= tree.overallReports-_parent.averageSubordinates;
		//console.log("----setting deviation: "+tree.averageDeviation);
	}
	//return level;
}

/** doing some calculations
 * 1) counts the number of nodes overall per depth level
 */
function _calculateTreeStats(tree){
	orgLevels = traverseBF(tree);
	MAX_LEVEL=orgLevels.length;
  logger.debug("_calculateTreeStats: MAX_LEVEL: "+MAX_LEVEL);
	var stats=new Array();
	//only if tree consists of no children then we have already on top of tree a leaf node ;-)
	if (!tree.children) stats.push({leafOnly:0});
	for (var o in orgLevels){
		var s = {leafOnlyReports:0,overallReports:0,directReports:0,termination:0,total:orgLevels[o].length};
		for (var l in orgLevels[o]){
			if (orgLevels[o][l].leafOnlyReports) s.leafOnlyReports+=orgLevels[o][l].leafOnlyReports;
			if (orgLevels[o][l].terminationDate) s.termination++;
      if (orgLevels[o][l].overallReports) s.overallReports+=orgLevels[o][l].overallReports;
      if (orgLevels[o][l].directReports) s.directReports+=orgLevels[o][l].directReports;;

		}
		stats.push(s)
	}
	return stats;
}

/**
on top some more metrics about each level
*/
function _calculateLevelStats(tree,statLevels){
	//getting tree clustered by levels
  var levels = traverseBF(tree);
	var MAX_LEVEL = levels.length;

  logger.debug("_calculateLevelStats: MAX_LEVEL: "+MAX_LEVEL);

	var _total = 0;
	for (var i in levels){
  _total+=statLevels[i].total;
  }

  var _sum =0;
	var _sumFemale=0;
	var _sumLeaf =0;
	var _sumTermination = 0;
  var _sumOverall = 0;


  var _percentageOverall = 0;
  var _femalePercentageOverall = 0;
  var _internalPercentageOverall = 0;
  var _terminationPercentageOverall = 0;
  var _leafPercentageOverall=0;


	for (var i in levels){
		var _perLevel = levels[i].length;
		var _percentage = Math.round((_perLevel/_total)*100);
    var _female = getFemaleQuotient(levels[i]);
		var _internal = getInternalQuotient(levels[i]);
		var _children =0;
		var _leaf =0;
		var _terminationPercentage = 0;
		var _leafPercentage;


		_leaf = statLevels[i].leafOnlyReports;
    var _overall = statLevels[i].overallReports;

		_leafPercentage = Math.round((_leaf/_overall)*100);
    
		_terminationPercentage = Math.round((statLevels[i].termination/_perLevel)*100);

		_sumLeaf+=statLevels[i].leafOnlyReports;
		_sumTermination+=statLevels[i].termination;
		_sum+=_perLevel;
		_sumFemale+=_female;
    _sumOverall+=_overall;


		console.log(levels[i].length+" - female: "+_female+"% - internal: "+_internal+"% - leaf: "+_leafPercentage+ "overall: "+_overall);
    statLevels[i].total=_perLevel;
    statLevels[i].overall=_overall;

    statLevels[i].percentage=_percentage;
    statLevels[i].femalePercentage=_female;
    statLevels[i].internalPercentage=_internal;
    statLevels[i].leafPercentage=_leafPercentage;
    statLevels[i].terminationPercentage=_terminationPercentage;

    _percentageOverall+=_percentage;
    _femalePercentageOverall+=_female;
    _internalPercentageOverall+=_internal;
    _terminationPercentageOverall+=_terminationPercentage;
    _leafPercentageOverall+=_leafPercentage;

	}

  var _overall={};
  _overall.femalePercentage = Math.round(_femalePercentageOverall/MAX_LEVEL);
  _overall.internalPercentage = Math.round(_internalPercentageOverall/MAX_LEVEL);
  _overall.terminationPercentage = Math.round(_terminationPercentageOverall/MAX_LEVEL);
  _overall.leafPercentage = Math.round(_leafPercentageOverall/MAX_LEVEL);
  _overall.percentage=Math.round(_percentageOverall);

  return _overall;
}



function _t(tree){
	console.log("_t says: visited "+tree.name+" level: "+tree.level);
}


function traverseBF(node,func){
	var q = [node];
	var levels = new Array();
	var count=0;
    while (q.length > 0) {
        count++;
        node = q.shift();
        if (!levels[node.level]) levels[node.level] = new Array();
        levels[node.level].push(node);
        if (func) {
            func(node);
        }
        _.each(node.children, function (child) {
            q.push(child);
        });
	}
	console.log("MAX level = "+levels.length+" --- count="+count);
	return levels;
}


function segmentByCriteria(data,criteria){
	return _.nst.nest(data,[criteria]);
}

function segmentByGender(data){
	return segmentByCriteria(data,"gender");
}

function segmentByContractType(data){
	return segmentByCriteria(data,"contractType");
}

function segmentByScrumTeam(data){
	 return segmentByCriteria(data,"Scrum Team 1");
}

/**returns percent rounded
 */
function getFemaleQuotient(data,criteria){
	var segment;
	if (criteria) segment = segmentByCriteria(data,criteria);
	else segment = segmentByGender(data);
	var _female = 0;
	var _male = 0;
	for (var i in segment.children){
		if (segment.children[i].name=="Female") _female=segment.children[i].children.length;
		if (segment.children[i].name=="Male") _male=segment.children[i].children.length;
	}
	return Math.round((_female/(_male+_female))*100)
}


function getInternalQuotient(data,criteria){
	var segment;
	if (criteria) segment = segmentByCriteria(data,criteria);
	else segment = segmentByContractType(data);
	var _internal = 0;
	var _nonInternal = 0;
	for (var i in segment.children){
		if (segment.children[i].name=="Internal") _internal=segment.children[i].children.length;
		else _nonInternal+=segment.children[i].children.length;
	}
	return Math.round((_internal/(_internal+_nonInternal))*100)
}

/**
 * recursive search by name and value
 * and returns the match as new root
 */
function _searchTreeBy(node,searchName,searchValue){
  	var children = node.children;
  	if (children){
  		for (var i in children){
        if (children[i][searchName] == searchValue){
          return children[i];
        }
        else{
          var found = _searchTreeBy(children[i],searchName,searchValue);
          if (found){
             //console.log("xxxxxx");
             return found;
          }
        }
  		}
  	}
    else{
      return;
    }
}
