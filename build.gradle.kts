import java.io.File
import groovy.json.JsonSlurper
import groovy.json.JsonOutput

// Run sync automatically during the configuration phase (runs on every Gradle Sync / build)
syncMcpToAndroidStudio()

fun syncMcpToAndroidStudio() {
    // 1. DYNAMIC SOURCE RESOLVER: Finds all .vscode/mcp.json files in the project structure, even nested
    val mcpFiles = project.fileTree(rootDir).matching {
        include("**/.vscode/mcp.json")
        exclude("**/.gradle/**", "**/build/**", "**/node_modules/**", "**/AppData/**", "**/Library/**")
    }.files

    if (mcpFiles.isEmpty()) {
        logger.lifecycle("ℹ️ MCP Sync: No .vscode/mcp.json found in the repository structure. Skipping sync.")
        return
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

    logger.lifecycle("🔍 MCP Sync: Syncing from ${mcpFiles.size} file(s) ➡️ [${globalMcpFile.absolutePath}]")

    try {
        // Automatically establish directory folders if they do not exist
        if (!globalMcpFile.parentFile.exists()) {
            globalMcpFile.parentFile.mkdirs()
        }

        val parser = JsonSlurper()

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

        // 5. Transfer custom workspace items from all discovered mcp.json files into target map containers
        var mergedAny = false
        for (sourceFile in mcpFiles) {
            try {
                val repoData = parser.parse(sourceFile) as? Map<*, *> ?: continue
                val repoServers = (repoData["servers"] as? Map<*, *>) ?: (repoData["mcpServers"] as? Map<*, *>) ?: continue
                
                repoServers.forEach { (key, value) ->
                    if (key != null && value != null) {
                        globalServers[key.toString()] = value
                    }
                }
                logger.lifecycle("   Merged: ${sourceFile.relativeTo(rootDir)}")
                mergedAny = true
            } catch (e: Exception) {
                logger.warn("⚠️ MCP Sync skipped parsing file [${sourceFile.name}]: ${e.message}")
            }
        }

        if (!mergedAny) {
            return
        }

        // Assign explicitly to the "servers" block layout required by Copilot
        globalData["servers"] = globalServers
        globalData.remove("mcpServers") // Clean up schema duplicates

        // 6. Push data safely to the user's host machine
        val outputJson = JsonOutput.toJson(globalData)
        globalMcpFile.writeText(JsonOutput.prettyPrint(outputJson))

        logger.lifecycle("✅ MCP Sync: Successfully updated local GitHub Copilot configuration.")
    } catch (e: Exception) {
        logger.warn("⚠️ MCP Sync skipped: ${e.message}")
    }
}

// Keep the task registered in case someone runs it manually
tasks.register("syncMcpToAndroidStudio") {
    group = "mcp"
    description = "Dynamically scans repo for mcp.json and pushes it into GitHub Copilot's local IntelliJ settings for any developer OS"
    doLast {
        syncMcpToAndroidStudio()
    }
}
