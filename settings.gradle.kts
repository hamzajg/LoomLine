pluginManagement {
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
    plugins {
        kotlin("jvm") version "2.4.21"
        kotlin("plugin.allopen") version "2.4.21"
        kotlin("plugin.jpa") version "2.4.21"
    }
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}

rootProject.name = "loomline"

include("api")
