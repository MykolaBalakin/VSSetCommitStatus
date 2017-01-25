import * as task from "vsts-task-lib/task";
import * as request from "request";

enum CommitStatusState {
	Pending,
	Success,
	Error,
	Failure
}

class CommitStatus {
    state: string;
    target_url: string;
    description: string;
    context: string;
}

class CommitStatusService {
	private serviceUri: string;
	private personalAcessToken: string;

	constructor(repositoryUri: string, personalAccessToken: string) {
		this.serviceUri = this.parseServiceUri(repositoryUri);
        this.personalAcessToken = personalAccessToken;

        console.log("Service URI: " + this.serviceUri);
	}

    private parseServiceUri(repositoryUri: string) {
        let prefix = "https://github.com/";
        let suffix = ".git";

        if (!repositoryUri.startsWith(prefix) || !repositoryUri.endsWith(suffix)) {
            throw new Error("Invalid repository URL");
        }

        let ownerAndRepository = repositoryUri.substring(prefix.length, repositoryUri.length - suffix.length);
        let parts = ownerAndRepository.split('/');

        return "https://api.github.com/repos/" + parts[0] + "/" + parts[1] + "/statuses/";
	}

    setStatus(commitHash: string, statusId: string, state: CommitStatusState, targetUrl: string, description: string) {
        let uri = this.serviceUri + commitHash;

        let content = new CommitStatus();
        content.context = statusId;
        content.description = description;
        content.state = CommitStatusState[state].toString().toLowerCase();
        content.target_url = targetUrl;

        console.log("Setting status " + statusId + " for commit " + commitHash);

        request
            .post({
                uri: uri,
                body: content,
                json: true,
                auth: {
                    user: "",
                    pass: this.personalAcessToken
                },
                headers: {
                    "User-Agent": "GitHubSetCommitStatus extension for VSTS"
                }
            }, function (error, response, body) {
                if (error || response.statusCode != 201) {
                    console.log(error);
                    console.log("Status code: " + response.statusCode);
                    console.log(body);
                    
                    throw new Error("Server returns an error");
                }
            });
	}
}

let repositoryUri = task.getVariable("Build.Repository.Uri");
let personalAccessToken = task.getInput("PersonalAccessToken");
let service = new CommitStatusService(repositoryUri, personalAccessToken);

let commitHash = task.getVariable("Build.SourceVersion");
let statusId = task.getInput("StatusId");
let state = CommitStatusState[task.getInput("State")];
let targetUrl = task.getInput("TargetUrl");
let description = task.getInput("Description");

service.setStatus(commitHash, statusId, state, targetUrl, description);