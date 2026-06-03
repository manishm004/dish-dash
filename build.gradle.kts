import java.io.File
import groovy.json.JsonSlurper
import groovy.json.JsonOutput

tasks.register("syncMcpToAndroidStudio") {
    group = "mcp"
    description = "Dynamically scans repo for mcp.json and pushes it into GitHub Copilot's local IntelliJ settings for any developer OS"

    @Suppress("UNCHECKED_CAST")
    doLast {
        // 1. DYNAMIC SOURCE RESOLVER: Finds mcp.json in the git repo regardless of root layout
        val repoMcpFile = File(rootDir, "dish-dash/.vscode/mcp.json")
        val sourceFile = if (repoMcpFile.exists()) repoMcpFile else {
            project.fileTree(rootDir).matching {
                include("**/mcp.json")
                exclude("**/.gradle/**", "**/build/**", "**/node_modules/**", "**/AppData/**", "**/Library/**")
            }.files.firstOrNull()
        }

        if (sourceFile == null || !sourceFile.exists()) {
            logger.lifecycle("ℹ️ MCP Sync: No source mcp.json found in the repository structure. Skipping sync.")
            return@doLast
        }

        // 2. DYNAMIC OS PATH RESOLVER: Detects operating system and adapts the target directory
        val os = System.getProperty("os.name").lowercase()
        val userHome = System.getProperty("user.home")

        val globalMcpFile = when {
            // Windows Path: Resolves to C:\Users\<Username>\AppData\Local\github-copilot\intellij\mcp.json
            os.contains("win") -> {
                val localAppData = System.getenv("LOCALAPPDATA") ?: "$userHome\\AppData\\Local"
                File(localAppData, "github-copilot/intellij/mcp.json")
            }
            // macOS Path: Resolves to /Users/<Username>/Library/Application Support/github-copilot/intellij/mcp.json
            os.contains("mac") -> {
                File(userHome, "Library/Application Support/github-copilot/intellij/mcp.json")
            }
            // Linux/Other Fallback Path
            else -> {
                File(userHome, ".config/github-copilot/intellij/mcp.json")
            }
        }

        logger.lifecycle("🔍 MCP Sync: Syncing from [${sourceFile.relativeTo(rootDir)}] ➡️ [${globalMcpFile.absolutePath}]")

        try {
            // Automatically establish directory folders if they do not exist
            if (!globalMcpFile.parentFile.exists()) {
                globalMcpFile.parentFile.mkdirs()
            }

            val parser = JsonSlurper()
            val repoData = parser.parse(sourceFile) as? Map<*, *> ?: return@doLast

            // Flexibly extract "servers" or "mcpServers" from git file
            val repoServers = (repoData["servers"] as? Map<*, *>) ?: (repoData["mcpServers"] as? Map<*, *>) ?: return@doLast

            // 3. Initialize or parse the existing target Copilot data safely
            val globalData = mutableMapOf<String, Any>()
            if (globalMcpFile.exists() && globalMcpFile.length() > 0) {
                val parsedGlobal = parser.parse(globalMcpFile) as? Map<*, *>
                parsedGlobal?.forEach { (key, value) ->
                    if (key != null && value != null) {
                        globalData[key.toString()] = value
                    }
                }
            }

            // 4. Copilot strictly looks for the top-level object key named "servers"
            val globalServers = mutableMapOf<String, Any>()
            val existingServers = (globalData["servers"] as? Map<*, *>) ?: (globalData["mcpServers"] as? Map<*, *>)
            existingServers?.forEach { (key, value) ->
                if (key != null && value != null) {
                    globalServers[key.toString()] = value
                }
            }

            // 5. Transfer custom workspace items into target map containers
            repoServers.forEach { (key, value) ->
                if (key != null && value != null) {
                    globalServers[key.toString()] = value
                }
            }

            // Assign explicitly to the "servers" block layout required by Copilot
            globalData["servers"] = globalServers
            globalData.remove("mcpServers") // Clean up schema duplicates

            // 6. Push data safely to the user's host machine
            val outputJson = JsonOutput.toJson(globalData as Map<Any, Any>)
            globalMcpFile.writeText(JsonOutput.prettyPrint(outputJson))

            logger.lifecycle("✅ MCP Sync: Successfully updated local GitHub Copilot configuration.")
        } catch (e: Exception) {
            logger.warn("⚠️ MCP Sync skipped: ${e.message}")
        }
    }
}

afterEvaluate {
    if (tasks.findByName("prepareKotlinBuildScriptModel") != null) {
        tasks.named("prepareKotlinBuildScriptModel") { dependsOn("syncMcpToAndroidStudio") }
    }
}
