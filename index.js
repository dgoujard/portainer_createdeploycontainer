const got = require('got');
const uuidv1 = require('uuid/v1');

(async () => {

    const LOGIN = process.env.LOGIN || "admin";
    const PASSWORD = process.env.PASSWORD;
    const URL = process.env.PASSWORD;
    const CONTAINER_IMAGE = process.env.CONTAINER_IMAGE;
    const CONTAINER_HOST_MOUNT_VOLUME = process.env.CONTAINER_HOST_MOUNT_VOLUME;

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
    
        if( authRequest.jwt == undefined)
          throw new Error("Missing auth token")
        const AUTH_TOKEN = authRequest.jwt
        
        const jsonClient = instance.extend({
            responseType: 'json',
            headers: {
                'authorization': 'Bearer '+AUTH_TOKEN
            }
        });

        //Create container
        const CONTAINER_NAME = uuidv1()
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

        if( createContainerRequest.Id == undefined)  
            throw new Error("Missing container ID in response")
        CONTAINER_ID = createContainerRequest.Id

        const startContainerRequest = await jsonClient.post("endpoints/1/docker/containers/"+CONTAINER_ID+"/start", {json: {}}).json();
        console.log("Done")
    } catch (error) {
		console.log(error)
	}
})();