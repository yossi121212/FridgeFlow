#!/bin/bash
kill -9 $(lsof -ti:3000-3009) || true
