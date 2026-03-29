// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CorePayroll {
    // -- 1. CONFIGURATION --
    address public admin;
    address public employer;
    address public taxVault;
    uint256 public constant TAX_RATE = 10;

    struct Stream {
        uint256 ratePerSecond;
        uint256 lastWithdrawTime;
        uint256 accruedBalance; // The Safety Net
        bool isActive;
    }

    mapping(address => Stream) public streams;

    event StreamStarted(address indexed employee, uint256 rate);
    event StreamPaused(address indexed employee, uint256 accruedBalance);
    event StreamCancelled(address indexed employee, uint256 accruedBalance);
    event Withdrawal(
        address indexed employee,
        uint256 netAmount,
        uint256 taxAmount
    );
    event TreasuryFunded(uint256 amount);
    event EmergencyWithdrawal(uint256 amountRecovered);
    event EmployerUpdated(address indexed previousEmployer, address indexed newEmployer);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can do this");
        _;
    }

    modifier onlyEmployer() {
        require(msg.sender == employer, "Only employer can do this");
        _;
    }

    modifier onlyAdminOrEmployer() {
        require(
            msg.sender == admin || msg.sender == employer,
            "Only admin or employer can do this"
        );
        _;
    }

    constructor(address _taxVault) {
        admin = msg.sender;
        employer = msg.sender;
        taxVault = _taxVault == address(0) ? employer : _taxVault;
    }

    receive() external payable {
        emit TreasuryFunded(msg.value);
    }

    // -- HR DASHBOARD FUNCTIONS --
    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function startStream(
        address _employee,
        uint256 _ratePerSecond
    ) external onlyAdminOrEmployer {
        require(_employee != address(0), "Invalid employee");
        require(_ratePerSecond > 0, "Rate must be greater than 0");
        Stream storage s = streams[_employee];

        // SAFETY NET: Save pending earnings before updating
        if (s.isActive) {
            uint256 timeElapsed = block.timestamp - s.lastWithdrawTime;
            s.accruedBalance += timeElapsed * s.ratePerSecond;
        }

        s.ratePerSecond = _ratePerSecond;
        s.lastWithdrawTime = block.timestamp;
        s.isActive = true;

        emit StreamStarted(_employee, _ratePerSecond);
    }

    function stopStream(address _employee) external onlyAdminOrEmployer {
        require(_employee != address(0), "Invalid employee");
        Stream storage s = streams[_employee];
        require(s.isActive, "Stream is already inactive");

        // SAFETY NET: Save final earnings before pausing
        uint256 timeElapsed = block.timestamp - s.lastWithdrawTime;
        s.accruedBalance += timeElapsed * s.ratePerSecond;

        s.isActive = false;
        emit StreamPaused(_employee, s.accruedBalance);
    }

    function cancelStream(address _employee) external onlyAdminOrEmployer {
        require(_employee != address(0), "Invalid employee");
        Stream storage s = streams[_employee];

        if (s.isActive) {
            uint256 timeElapsed = block.timestamp - s.lastWithdrawTime;
            s.accruedBalance += timeElapsed * s.ratePerSecond;
        }

        require(
            s.ratePerSecond > 0 || s.accruedBalance > 0,
            "Stream is not configured"
        );

        s.isActive = false;
        s.ratePerSecond = 0;
        s.lastWithdrawTime = block.timestamp;

        emit StreamCancelled(_employee, s.accruedBalance);
    }

    // -- EMPLOYEE PORTAL FUNCTIONS --
    function claimableAmount(address _employee) public view returns (uint256) {
        Stream memory s = streams[_employee];
        uint256 total = s.accruedBalance;

        if (s.isActive) {
            uint256 timeElapsed = block.timestamp - s.lastWithdrawTime;
            total += timeElapsed * s.ratePerSecond;
        }
        return total;
    }

    function withdraw() external {
        uint256 totalAccrued = claimableAmount(msg.sender);
        require(totalAccrued > 0, "No funds earned yet");
        require(
            address(this).balance >= totalAccrued,
            "Treasury empty - Contact HR"
        );

        Stream storage s = streams[msg.sender];
        s.lastWithdrawTime = block.timestamp;
        s.accruedBalance = 0;

        uint256 taxDeduction = (totalAccrued * TAX_RATE) / 100;
        uint256 netSalary = totalAccrued - taxDeduction;

        (bool taxSuccess, ) = payable(taxVault).call{value: taxDeduction}("");
        require(taxSuccess, "Tax transfer failed");

        (bool empSuccess, ) = payable(msg.sender).call{value: netSalary}("");
        require(empSuccess, "Employee transfer failed");

        emit Withdrawal(msg.sender, netSalary, taxDeduction);
    }

    function emergencyWithdraw() external onlyAdmin {
        uint256 balance = address(this).balance;
        require(balance > 0, "Treasury is already empty");

        (bool success, ) = payable(admin).call{value: balance}("");
        require(success, "Emergency withdrawal failed");

        emit EmergencyWithdrawal(balance);
    }

    function setEmployer(address _newEmployer) external onlyAdmin {
        require(_newEmployer != address(0), "Invalid employer");
        address previousEmployer = employer;
        employer = _newEmployer;
        emit EmployerUpdated(previousEmployer, _newEmployer);
    }

    function setTaxVault(address _taxVault) external onlyAdminOrEmployer {
        require(_taxVault != address(0), "Invalid address");
        taxVault = _taxVault;
    }
}
