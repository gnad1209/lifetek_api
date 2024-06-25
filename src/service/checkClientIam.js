const checkClientIam = (IamClient) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(IamClient)
            const iamClientId = IamClient.iamClientId;
            const iamClientSecret = IamClient.iamClientSecret;
            resolve({ iamClientId: iamClientId, iamClientSecret: iamClientSecret })
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = checkClientIam