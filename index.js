const got = require('got');
const uuidv1 = require('uuid/v1');
const core = require('@actions/core');

(async () => {

    const LOGIN = process.env.LOGIN || core.getInput('login') || "admin";
    const PASSWORD = process.env.PASSWORD || core.getInput('password');
    const URL = process.env.URL || core.getInput('url');
    const CONTAINER_IMAGE = process.env.CONTAINER_IMAGE || core.getInput('container_image');
    const CONTAINER_HOST_MOUNT_VOLUME = process.env.CONTAINER_HOST_MOUNT_VOLUME || core.getInput('container_out_host_volume_path');
    const instance = got.extend({
        prefixUrl: URL,
        responseType: 'json'
    });
    try {
        //Auth
        const authRequest = await instance.post('auth', {json: {
            "Username": LOGIN,
            "Password": PASSWORD
          }}).json();
          console.log("1");

        if( authRequest.jwt == undefined)
          throw new Error("Missing auth token")
          console.log("2");

        const AUTH_TOKEN = authRequest.jwt
        console.log("3");

        const jsonClient = instance.extend({
            responseType: 'json',
            headers: {
                'authorization': 'Bearer '+AUTH_TOKEN
            }
        });
        console.log("4");
       

        //Create container
        const CONTAINER_NAME = uuidv1()
        console.log({
            "Image":CONTAINER_IMAGE,
            "HostConfig":{
                "RestartPolicy":{"Name":"no"},
                "Binds":[CONTAINER_HOST_MOUNT_VOLUME+":/volume_out"],
                "AutoRemove":false,
                "NetworkMode":"bridge",
                "Privileged":false,
            },
            "name":CONTAINER_NAME
            });
        const createContainerRequest = await jsonClient.post("endpoints/1/docker/containers/create?name="+CONTAINER_NAME, {json: {
            "Image":CONTAINER_IMAGE,
            "HostConfig":{
                "RestartPolicy":{"Name":"no"},
                "Binds":[CONTAINER_HOST_MOUNT_VOLUME+":/volume_out"],
                "AutoRemove":false,
                "NetworkMode":"bridge",
                "Privileged":false,
            },
            "name":CONTAINER_NAME
            }}).json();
            console.log("5");
console.log(createContainerRequest)
        if( createContainerRequest.Id == undefined)  
            throw new Error("Missing container ID in response")
            console.log("6");

        CONTAINER_ID = createContainerRequest.Id

        const startContainerRequest = await jsonClient.post("endpoints/1/docker/containers/"+CONTAINER_ID+"/start", {json: {}}).json();
        console.log("Done")
    } catch (error) {
		console.log(error)
	}
})();