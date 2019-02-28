import requests
import time
from openpyxl import Workbook


def stamp_to_time(stamp,strformat="%Y-%m-%d %H:%M:%S"):
    stamp = int(stamp)
    ltime = time.localtime(stamp)
    timeStr = time.strftime(strformat, ltime)
    return timeStr


class RestserverOperator(object):
    def __init__(self, server_ip, admin_config):
        self.ip = server_ip
        # access rest-server by pylon
        self.server_url = "http://{}/rest-server".format(server_ip)
        self.job_server_url = self.server_url + "/api/v1/jobs"
        self.token_server_url = self.server_url + "/api/v1/token"
        self.admin = admin_config
        self.token = self.update_token()

    def update_token(self):
        return requests.post(self.token_server_url, self.admin).json()['token']

    def get_jobs(self):
        response = requests.get(
            self.job_server_url,
            headers={
                'Authorization': u'Bearer ' + self.token,
            }
        )
        return response.json()


class LauncherOperator(object):
    def __init__(self, server_ip):
        self.ip = server_ip
        # access launcher directly
        self.server_url = "http://{}:9086".format(server_ip)

    def get_job_launched_time(self, username, filename):
        url = "{}/v1/Frameworks/{}~{}".format(self.server_url, username, filename)
        job_info = requests.get(url).json()
        return job_info["aggregatedFrameworkStatus"]["frameworkStatus"]["applicationLaunchedTimestamp"]

    def get_job_resource(self, username, filename, exclude_am=True):
        url = "{}/v1/Frameworks/{}~{}".format(self.server_url, username, filename)
        job_info = requests.get(url).json()

        request_resource = {
            "cpu_num": 0,
            "gpu_num": 0,
            "memory_mb": 0,
        }

        task_roles = job_info["aggregatedFrameworkRequest"]["frameworkRequest"]["frameworkDescriptor"]["taskRoles"]

        for task_role_name in task_roles:
            task_num = task_roles[task_role_name]["taskNumber"]
            task_resource = {
                "cpu_num": task_roles[task_role_name]["taskService"]["resource"]["cpuNumber"] * task_num,
                "gpu_num": task_roles[task_role_name]["taskService"]["resource"]["gpuNumber"] * task_num,
                "memory_mb": task_roles[task_role_name]["taskService"]["resource"]["memoryMB"] * task_num,
            }
            request_resource["cpu_num"] += task_resource["cpu_num"]
            request_resource["gpu_num"] += task_resource["gpu_num"]
            request_resource["memory_mb"] += task_resource["memory_mb"]

        if not exclude_am:
            am_resource = job_info["aggregatedFrameworkRequest"]["frameworkRequest"]["frameworkDescriptor"]["platformSpecificParameters"]["amResource"]
            request_resource["cpu_num"] += am_resource["cpuNumber"]
            request_resource["gpu_num"] += am_resource["gpuNumber"]
            request_resource["memory_mb"] += am_resource["memoryMB"]

        return request_resource

    def get_job_retry_num(self, username, filename):

        url = "{}/v1/Frameworks/{}~{}".format(self.server_url, username, filename)
        job_info = requests.get(url).json()
        job_retry = job_info["aggregatedFrameworkStatus"]["frameworkStatus"]["frameworkRetryPolicyState"]
        # transientNormalRetriedCount: might succeed if retry, such as OS kill process
        # transientConflictRetriedCount: gang allocation failed
        # nonTransientRetriedCount: can't succeed even retry, such as file doesn't exist
        # unKnownRetriedCount: unknown reason
        # succeededRetriedCount: retry even succeed
        retry_count = {
            "system_failure": job_retry["transientNormalRetriedCount"],
            "user_failure": job_retry["transientConflictRetriedCount"] + job_retry["unKnownRetriedCount"]
                            + job_retry["nonTransientRetriedCount"] + job_retry["succeededRetriedCount"],

        }
        return retry_count



def main():
    master_ip = "xx.xx.xx.xx"   # master node ip
    admin_config = {
        "username": "xxx",  # rest-server username
        "password": "xxx"   # rest-server password
    }

    workbook = Workbook()
    worksheet = workbook.create_sheet("Job list")
    worksheet.append((
        "name", "username", "vc", "retry", "state", "gpunumber", "created_time", "start_time", "completed_time", "waittime", "runtimes", "system_failure"))

    restserver_operator = RestserverOperator(master_ip, admin_config)
    launcher_operator = LauncherOperator(master_ip)

    job_list = restserver_operator.get_jobs()
    earliest_time = 1546272000000  # '2019-01-01 00:00:00'
    try:
        for job in job_list:

            # Ignore running or waiting jobs
            if job['completedTime'] is None:
                continue

            # Ignore earlier jobs
            if job['createdTime'] < earliest_time:
                continue

            name = job['name']
            username = job['username']
            vc = job['virtualCluster']
            retry = job['retries']
            state = job['state']
            gpunumber = launcher_operator.get_job_resource(username, name)["gpu_num"]
            ctime = job['createdTime'] / 1000
            created_time = stamp_to_time(ctime)
            otime = job['completedTime'] / 1000
            completed_time = stamp_to_time(otime)
            system_failure = launcher_operator.get_job_retry_num(username, name)["system_failure"] > 0
            launched_time = launcher_operator.get_job_launched_time(username, name)
            if (launched_time is None or launched_time == "null"):
                print("Warning: no launcher time for: {}~{}".format(username, name))
                continue

            start_time_stamp = int(launched_time) / 1000
            start_time = stamp_to_time(start_time_stamp)

            times1 = job['completedTime'] / 1000
            times2 = job['createdTime'] / 1000
            waittime = int(start_time_stamp - times2)
            runtimes = int(times1 - start_time_stamp)

            data_joblist = (name, username, vc, retry, state, gpunumber, created_time, start_time, completed_time, waittime, runtimes, system_failure)
            print(data_joblist)
            worksheet.append(data_joblist)
    except Exception as e:
        pass
    finally:
        workbook.save('usage.xlsx')


if __name__ == '__main__':
   main()