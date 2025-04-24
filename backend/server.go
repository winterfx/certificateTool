package main

import (
	"github.com/gin-gonic/gin"
)

func LaunchServer() {
	r := gin.Default()

	r.POST("/api/cert/parse", handleCertParse)
	r.POST("/api/cert/parse/with-password", handleCertParseWithPassword)
	err := r.Run(":8080")
	if err != nil {
		panic("Failed to start server: " + err.Error())
	}
}
