import React from 'react';
import './App.css';
import { ChatMessageList } from "./ChatMessageList";
import { RoomList } from "./RoomList";


function App()
{
	return (
		<div className="App">
			<div className="App-body">
				<div className="RoomColumn">
					<RoomList></RoomList>
				</div>
				<div className="ChatColumn">
					<ChatMessageList
						serverUrl="localhost:6612"
						roomId="g0x827321bdda13dce855ab6f8a52952cc9bd0574ba"/>
				</div>
			</div>
		</div>
	);
}

export default App;