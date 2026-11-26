import { Pathfinding } from "three-pathfinding";

export default class Navigation {
    constructor(){
        this.pathfinder = new Pathfinding()
        this.zones = new Set();
    }

    loadNavMesh(zoneName, geometry){
        if (!zoneName || !geometry?.isBufferGeometry){
            console.error("ERROR: NavMesh requires a zone name and BufferGeometry!");
            return this;
        }
        const zone = Pathfinding.createZone(geometry);

        this.pathfinder.setZoneData(zoneName, zone);
        this.zones.add(zoneName);

        return this;
    }

    hasZone(zoneName){
        return this.zones.has(zoneName);
    }

    getGroup(zoneName, position){
        if(!this.hasZone(zoneName) || !position){
            console.error("ERROR: zoneName doesn't exist or position is missing!");
            return null;
        }

        return this.pathfinder.getGroup(zoneName, position);
    }

    findPath(from, to, zoneName){
       if (!this.hasZone(zoneName) || !from || !to){
            console.error("ERROR: zoneName doesn't exist or from/to is missing!");
            return [];
        }

        const groupID = this.getGroup(zoneName,from);
        if (groupID == null){
            return[]
        }
        
        const wayPoint = this.pathfinder.findPath(
            from,
            to, 
            zoneName,
            groupID
        );
        
        return wayPoint?? [];
    }

    getClosestNode(position, zoneName){
        if(!this.hasZone(zoneName) || !position) return null;

        const groupID = this.getGroup(zoneName,position);
        if(groupID == null) return null;

        return this.pathfinder.getClosestNode(position,zoneName,groupID)
    }
}