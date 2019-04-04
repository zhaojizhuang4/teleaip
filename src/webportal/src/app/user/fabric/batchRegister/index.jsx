// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// import * as querystring from 'querystring';

import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
// import {debounce} from 'lodash';

import {initializeIcons} from 'office-ui-fabric-react/lib/Icons';
import {Fabric} from 'office-ui-fabric-react/lib/Fabric';
// import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
// import {Overlay} from 'office-ui-fabric-react/lib/Overlay';
import {Stack} from 'office-ui-fabric-react/lib/Stack';

// import Context from './Context';
// import Filter from './Filter';
// import Ordering from './Ordering';
// import Pagination from './Pagination';
// import Paginator from './Paginator';
// import Table from './Table';
// import TopBar from './TopBar';
import Context from './context';
import BackButton from '../components/back';
import TopBar from './topBar';

import webportalConfig from '../../../config/webportal.config';
import userAuth from '../../user-auth/user-auth.component';

const csvParser = require('papaparse');
const stripBom = require('strip-bom-string');
const columnUsername = 'username';
const columnPassword = 'password';
const columnAdmin = 'admin';
const columnVC = 'virtual cluster';
const columnGithubPAT = 'githubPAT';

initializeIcons();

// function getError(error) {
//   return (
//     <Overlay>
//       <MessageBar messageBarType={MessageBarType.blocked}>
//         {error}
//       </MessageBar>
//     </Overlay>
//   );
// }

export default function BatchRegister() {
  // const admin = userAuth.checkAdmin();
  // const username = cookies.get('user');

  const [userInfos, setUserInfos] = useState(null);
  // const [selectedJobs, setSelectedJobs] = useState([]);
  // const [error, setError] = useState(null);

  // const initialFilter = useMemo(() => {
  //   const initialFilterUsers = (username && !admin) ? new Set([username]) : undefined;
  //   const filter = new Filter(undefined, initialFilterUsers);
  //   filter.load();
  //   return filter;
  // });
  // const [filter, setFilter] = useState(initialFilter);
  // const [ordering, setOrdering] = useState(new Ordering());
  // const [pagination, setPagination] = useState(new Pagination());
  // const [filteredJobs, setFilteredJobs] = useState(null);

  // useEffect(() => filter.save(), [filter]);

  // const {current: applyFilter} = useRef(debounce((allJobs, /** @type {Filter} */filter) => {
  //   setFilteredJobs(filter.apply(allJobs || []));
  // }, 200));

  // useEffect(() => {
  //   applyFilter(allJobs, filter);
  // }, [applyFilter, allJobs, filter]);

  // useEffect(() => {
  //   setPagination(new Pagination(pagination.itemsPerPage, 0));
  // }, [filteredJobs]);

  // const stopJob = useCallback((...jobs) => {
  //   userAuth.checkToken((token) => {
  //     jobs.forEach((job) => {
  //       const {name, username} = job;
  //       fetch(`${webportalConfig.restServerUri}/api/v1/user/${username}/jobs/${name}/executionType`, {
  //         method: 'PUT',
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({value: 'STOP'}),
  //       }).then((response) => {
  //         if (response.ok) {
  //           job.executionType = 'STOPPING';
  //           delete job._statusText;
  //           delete job._statusIndex;
  //           setAllJobs(allJobs.slice());
  //         } else {
  //           return response.json().then((data) => {
  //             throw Error(data.message);
  //           });
  //         }
  //       }).catch((reason) => {
  //         setError(reason.message);
  //         setTimeout(setError, 1000, null);
  //       });
  //     });
  //   });
  // }, [allJobs]);

  // const refreshJobs = useCallback(function refreshJobs() {
  //   setAllJobs(null);
  //   const query = querystring.parse(location.search.replace(/^\?/, ''));
  //   if (query['vcName']) {
  //     const {keyword, users, virtualClusters, statuses} = filter;
  //     setFilter(new Filter(keyword, users, virtualClusters.add(query['vcName']), statuses));
  //   }
  //   fetch(`${webportalConfig.restServerUri}/api/v1/jobs`)
  //     .then((response) => {
  //       if (!response.ok) {
  //         throw Error(response.message);
  //       } else {
  //         return response.json();
  //       }
  //     })
  //     .then(setAllJobs)
  //     .catch((reason) => {
  //       setError(reason.message);
  //       setTimeout(setError, 1000, null);
  //     });
  // }, []);

  // useEffect(refreshJobs, []);

  const downloadTemplate = () => {
    let csvString = csvParser.unparse([{
      [columnUsername]: 'student1',
      [columnPassword]: '111111',
      [columnAdmin]: false,
      [columnVC]: 'default',
      [columnGithubPAT]: '',
    }]);
    let universalBOM = '\uFEFF';
    let filename = 'userinfo.csv';
    let file = new Blob([universalBOM + csvString], {type: 'text/csv;charset=utf-8'});
    if (window.navigator.msSaveOrOpenBlob) { // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    } else { // Others
      let a = document.createElement('a');
      let url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  };

  const parseUserInfosFromCSV = (csvContent) => {
    if (!csvContent) {
      alert('Empty CSV file');
      return null;
    }
    let csvResult = csvParser.parse(stripBom(csvContent), {
      header: true,
      skipEmptyLines: true,
    });
    let fields = csvResult.meta.fields;
    if (fields.indexOf(columnUsername) === -1) {
      alert('Missing column of username in the CSV file!');
      return null;
    }
    if (fields.indexOf(columnPassword) === -1) {
      alert('Missing column of password in the CSV file!');
      return null;
    }
    if (csvResult.errors.length > 0) {
      alert(`Row ${csvResult.errors[0].row + 2}: ${csvResult.errors[0].message}`);
      return null;
    }
    if (csvResult.data.length == 0) {
      alert('Empty CSV file');
      return null;
    }
    return csvResult.data;
  };

  const importFromCSV = () => {
    let readFile = function(e) {
      let file = e.target.files[0];
      if (!file) {
        return;
      }
      let reader = new FileReader();
      reader.onload = function(e) {
        let csvResult = parseUserInfosFromCSV(e.target.result);
        if (csvResult) {
          setUserInfos(csvResult);
          console.log(csvResult);
        }
        document.body.removeChild(fileInput);
      };
      reader.readAsText(file);
    };
    let fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.onchange = readFile;
    document.body.appendChild(fileInput);
    fileInput.click();
  };

  const context = {
    downloadTemplate,
    importFromCSV,
    userInfos,
  };

  // return (
  //   <Context.Provider value={context}>
  //     <Fabric style={{height: '100%'}}>
  //       <Stack verticalFill styles={{root: {position: 'relative', padding: '0 20px 20px'}}}>
  //         <Stack.Item>
  //           <TopBar/>
  //         </Stack.Item>
  //         <Stack.Item grow styles={{root: {height: 1, overflow: 'auto', backgroundColor: 'white', paddingTop: 15}}}>
  //           <Table/>
  //         </Stack.Item>
  //         <Stack.Item styles={{root: {backgroundColor: 'white', paddingBottom: 15}}}>
  //           <Paginator/>
  //         </Stack.Item>
  //         {error !== null ? getError(error) : null}
  //       </Stack>
  //     </Fabric>
  //   </Context.Provider>
  // );

  return (
    <Context.Provider value={context}>
      <Fabric style={{height: '100%'}}>
        <Stack verticalFill styles={{root: {position: 'relative', padding: '2rem'}}}>
          <Stack.Item>
            <BackButton />
          </Stack.Item>
          <Stack.Item>
            <TopBar />
          </Stack.Item>
          <Stack.Item>
            <BackButton />
          </Stack.Item>
          <Stack.Item>
            <BackButton />
          </Stack.Item>
        </Stack>
      </Fabric>
    </Context.Provider>
  )
    ;
}
