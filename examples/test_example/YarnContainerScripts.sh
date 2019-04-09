#!/bin/bash

exec 13>/root/test_handler/YarnContainerDebug.log
BASH_XTRACEFD=13

function sigterm_handler()
{
  printf "[DEBUG] sigterm handler\n"
  exit 143
}


function exit_handler()
{
  rc=$?
  printf "[DEBUG] exit handler\n"
  exit $rc
}

set -x
PS4="+[\t] "
trap sigterm_handler SIGTERM
trap exit_handler EXIT

printf "user command: stdout" >&1
printf "user command: stderr" >&2