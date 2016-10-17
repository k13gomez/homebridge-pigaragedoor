
# HttpGarageDoor Plugin

Example config.json:

    {
      "accessories": [
        {
          "accessory": "HttpGarageDoor",
          "name": "Garage Door",
          "status_endpoint": "http://localhost:3000/api/status",
          "toggle_endpoint": "http://localhost:3000/api/toggle"
        }
      ]
    }
